import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { Firestore, Transaction } from 'firebase-admin/firestore'
import { Account, INSTRUMENTS, Market, scenarioById, validOrder, COUNTRY_CODES } from './model'
import {
  createAccount,
  advanceAccount,
  placeOrder,
  placeBasket,
  cancelOrder,
  valuation,
  performance,
  objectives,
} from './broker'
import { quote, candles, newsAt } from './market'
import { DeskError } from './errors'
export { DeskError } from './errors'
import { assertNotDeleting, requestDeletion } from './deletion'
export interface Actor {
  uid: string | null
  admin: boolean
  member: boolean
  authTime?: number
}
interface Season {
  id: string
  title: string
  seed: string
  scenario: string
  startsAt: number
  endsAt: number
  tickMs: number
  horizon: number
  state: string
  members: number
}
interface Profile {
  displayName: string
  country: string
  region: string
  ageBand: string
  publicRanking: boolean
  status: string
  hasJoinedSeason?: boolean
}
interface Session {
  seasonId: string
  account: Account
  revision: number
  receipts: { id: string; hash: string }[]
  updatedAt: number
}
interface Control {
  activeSeasonId: string | null
  newOrdersEnabled: boolean
  message: string
  revision: number
}
const fail = (message: string): never => {
  throw new DeskError('invalid-argument', message)
}
const text = (value: unknown, max: number, required = true): string => {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim()))
    return fail('입력 문자의 길이를 확인하세요.')
  const cleaned = value.trim().replace(/[<>\u0000-\u001f]/g, '')
  if (required && !cleaned.trim()) return fail('내용을 입력하세요.')
  return cleaned
}
const id = (value: unknown): string => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value))
    return fail('식별자가 올바르지 않습니다.')
  return value
}
const countries = ['', 'OTHER', ...COUNTRY_CODES]
export const AGE_BANDS = ['', 'under18', '18-24', '25-34', '35-44', '45-54', '55plus']
function profileInput(value: unknown): Profile {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return fail('프로필을 입력하세요.')
  const p = value as Record<string, unknown>
  if (
    !countries.includes(String(p.country)) ||
    !AGE_BANDS.includes(String(p.ageBand)) ||
    typeof p.publicRanking !== 'boolean'
  )
    return fail('국가·연령대·공개 동의를 확인하세요.')
  return {
    displayName: text(p.displayName, 24),
    country: String(p.country),
    region: text(p.region, 40, false).toLocaleLowerCase('ko'),
    ageBand: String(p.ageBand),
    publicRanking: p.publicRanking,
    status: 'active',
  }
}
const defaultControl = (): Control => ({
  activeSeasonId: null,
  newOrdersEnabled: true,
  message: '',
  revision: 0,
})
function publicSeason(s: Season | null) {
  return s
    ? {
        id: s.id,
        title: s.title,
        scenario: s.scenario,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        tickMs: s.tickMs,
        horizon: s.horizon,
        state: s.state,
        members: s.members,
      }
    : null
}
function tickAt(s: Season, now: number) {
  return Math.max(
    0,
    Math.min(s.horizon, Math.floor((Math.min(now, s.endsAt) - s.startsAt) / s.tickMs))
  )
}
function marketAt(s: Season, tick: number): Market {
  return { seed: s.seed, scenario: s.scenario, tick }
}
function marketView(s: Season, tick: number) {
  const market = marketAt(s, tick)
  return {
    tick,
    scenario: s.scenario,
    prices: Object.fromEntries(INSTRUMENTS.map((a) => [a.id, quote(a.id, market).price])),
    news: newsAt(market),
  }
}
function sessionView(s: Season, session: Session, now: number) {
  const m = marketAt(s, session.account.tick)
  return {
    season: publicSeason(s),
    account: session.account,
    revision: session.revision,
    summary: valuation(session.account, m),
    performance: performance(session.account, m),
    objectives: objectives(session.account, m),
    market: marketView(s, session.account.tick),
    catchingUp: session.account.tick < tickAt(s, now),
    serverTime: now,
  }
}
async function controlAndSeason(db: Firestore) {
  const snapshot = await db.doc('deskControl/current').get(),
    control = snapshot.exists ? (snapshot.data() as Control) : defaultControl()
  const season = control.activeSeasonId
    ? ((await db.doc('deskSeasons/' + control.activeSeasonId).get()).data() as Season | undefined)
    : null
  return { control, season: season || null }
}
function requireMember(actor: Actor): string {
  if (!actor.uid) throw new DeskError('unauthenticated', '먼저 로그인하세요.')
  if (!actor.member)
    throw new DeskError('permission-denied', 'Google 계정 또는 인증된 이메일 계정이 필요합니다.')
  return actor.uid
}
function requireAdmin(actor: Actor): string {
  const uid = requireMember(actor)
  if (!actor.admin) throw new DeskError('permission-denied', '운영자 권한이 필요합니다.')
  return uid
}
async function rateLimit(
  db: Firestore,
  uid: string,
  now: number,
  limit = 120,
  deletionRetry = false
) {
  const ref = db.doc('deskLimits/' + uid)
  await db.runTransaction(async (tx) => {
    const deletion = await tx.get(db.doc('deskDeletions/' + uid))
    if (deletion.exists) {
      if (!deletionRetry)
        throw new DeskError('failed-precondition', '계정 삭제가 접수됐습니다. 로그아웃하세요.')
      // An already verified request may finish after the worker deletes Auth.
      // Do not recreate a rate-limit document after erasure has completed.
      if (deletion.data()?.state === 'complete') return
    }
    const doc = await tx.get(ref),
      previous = doc.data(),
      bucket = Math.floor(now / 60000)
    const count = previous?.bucket === bucket ? previous.count + 1 : 1
    if (count > limit)
      throw new DeskError('resource-exhausted', '요청이 많습니다. 잠시 후 다시 시도하세요.')
    tx.set(ref, { bucket, count, expiresAt: new Date(now + 86400000) })
  })
}
function publish(
  tx: Transaction,
  db: Firestore,
  uid: string,
  s: Season,
  session: Session,
  profile: Profile,
  now: number
) {
  const a = session.account,
    m = marketAt(s, a.tick),
    v = valuation(a, m),
    returns = performance(a, m)
  tx.set(db.doc('deskLeaderboard/' + s.id + '/entries/' + uid), {
    uid,
    displayName: profile.displayName,
    country: profile.country,
    region: profile.region,
    ageBand: profile.ageBand,
    eligible: profile.publicRanking && profile.status === 'active' && a.tick >= tickAt(s, now),
    returns,
    equity: v.equity,
    drawdown: a.maxDrawdown,
    trades: a.trades,
    tick: a.tick,
    updatedAt: now,
    joinedTick: a.startedTick,
  })
}
export async function syncSession(
  db: Firestore,
  uid: string,
  now: number,
  command?: Record<string, unknown>
) {
  return db.runTransaction(async (tx) => {
    await assertNotDeleting(tx, db, uid)
    const ref = db.doc('deskAccounts/' + uid),
      sessionDoc = await tx.get(ref),
      profileDoc = await tx.get(db.doc('deskProfiles/' + uid)),
      controlDoc = await tx.get(db.doc('deskControl/current'))
    if (!sessionDoc.exists || !profileDoc.exists)
      throw new DeskError('failed-precondition', '시즌에 먼저 참가하세요.')
    const session = sessionDoc.data() as Session,
      profile = profileDoc.data() as Profile,
      control = (controlDoc.data() || defaultControl()) as Control
    if (command && profile.status !== 'active')
      throw new DeskError('permission-denied', '이 계정은 운영 검토 중입니다.')
    const seasonDoc = await tx.get(db.doc('deskSeasons/' + session.seasonId))
    if (!seasonDoc.exists) throw new DeskError('not-found', '시즌을 찾을 수 없습니다.')
    const s = seasonDoc.data() as Season
    if (command && command.seasonId !== session.seasonId)
      throw new DeskError(
        'failed-precondition',
        '주문의 시즌과 현재 계좌가 다릅니다. 새 시즌 상태를 확인하세요.'
      )
    const requestHash = command
      ? createHash('sha256')
          .update(
            JSON.stringify({
              op: command.op,
              order: command.order ?? null,
              orders: command.orders ?? null,
              orderId: command.orderId ?? null,
            })
          )
          .digest('hex')
      : ''
    if (command) {
      const key = id(command.requestId),
        receipt = session.receipts.find((r) => r.id === key)
      if (receipt) {
        if (receipt.hash !== requestHash)
          throw new DeskError(
            'invalid-argument',
            '같은 요청 번호에 다른 주문을 사용할 수 없습니다.'
          )
        return { ...sessionView(s, session, now), duplicate: true }
      }
      if (command.revision !== session.revision)
        throw new DeskError('aborted', '계좌가 다른 요청에서 갱신됐습니다. 최신 상태를 확인하세요.')
      if (
        s.state !== 'active' ||
        now < s.startsAt ||
        now >= s.endsAt ||
        control.activeSeasonId !== s.id
      )
        throw new DeskError('failed-precondition', '현재 주문 가능한 시즌이 아닙니다.')
    }
    const target = Math.min(session.account.endTick, tickAt(s, now))
    let account = advanceAccount(
      session.account,
      { seed: s.seed, scenario: s.scenario },
      Math.max(session.account.tick, target)
    )
    const catchingUp = account.tick < target
    if (command && !catchingUp) {
      const m = marketAt(s, account.tick)
      if (!control.newOrdersEnabled && command.op !== 'cancel') {
        if (command.op !== 'order' || !validOrder(command.order).reduceOnly)
          throw new DeskError(
            'failed-precondition',
            control.message || '신규 주문이 일시 중지됐습니다. 청산 전용 주문은 가능합니다.'
          )
      }
      if (command.op === 'order') account = placeOrder(account, m, command.order)
      else if (command.op === 'basket')
        account = placeBasket(account, m, command.orders as unknown[])
      else if (command.op === 'cancel') account = cancelOrder(account, id(command.orderId))
      else return fail('지원하지 않는 주문입니다.')
    }
    if (account.tick >= s.horizon && account.status === 'active') {
      account.status = 'completed'
      account.orders = []
    }
    const next: Session = {
      ...session,
      account,
      revision: session.revision + 1,
      updatedAt: now,
      receipts:
        command && !catchingUp
          ? [...session.receipts, { id: id(command.requestId), hash: requestHash }].slice(-64)
          : session.receipts,
    }
    tx.set(ref, next)
    publish(tx, db, uid, s, next, profile, now)
    return {
      ...sessionView(s, next, now),
      accepted: !catchingUp,
      ...(catchingUp
        ? { message: '서버에서 누락 기간을 정산하고 있습니다. 정산 완료 후 다시 주문하세요.' }
        : {}),
    }
  })
}
export async function deskService(
  db: Firestore,
  actor: Actor,
  input: unknown,
  now = Date.now()
): Promise<unknown> {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    JSON.stringify(input).length > 20000
  )
    return fail('요청 크기 또는 형식이 올바르지 않습니다.')
  const data = input as Record<string, unknown>,
    op = String(data.op || '')
  if (op === 'deleteAccount') {
    if (!actor.uid) throw new DeskError('unauthenticated', '먼저 로그인하세요.')
    if (data.confirmation !== 'DELETE') return fail('삭제 확인이 필요합니다.')
    await rateLimit(db, actor.uid, now, 120, true)
    return requestDeletion(db, actor.uid, actor.authTime ?? NaN, now)
  }
  if (!actor.uid) throw new DeskError('unauthenticated', '먼저 로그인하세요.')
  await rateLimit(db, actor.uid, now)
  if (op === 'bootstrap') {
    const { control, season } = await controlAndSeason(db)
    const profile = actor.uid
      ? (await db.doc('deskProfiles/' + actor.uid).get()).data() || null
      : null
    const stored = actor.uid
      ? ((await db.doc('deskAccounts/' + actor.uid).get()).data() as Session | undefined)
      : undefined
    const ownSeason = stored
      ? ((await db.doc('deskSeasons/' + stored.seasonId).get()).data() as Season | undefined)
      : undefined
    return {
      control,
      season: publicSeason(season),
      profile,
      admin: actor.admin,
      member: actor.member,
      session: stored && ownSeason ? sessionView(ownSeason, stored, now) : null,
    }
  }
  if (op === 'leaderboard') {
    const { season } = await controlAndSeason(db)
    if (!season) return { entries: [], season: null, cohortPending: false }
    const period = ['day', 'week', 'month', 'season'].includes(String(data.period))
      ? String(data.period)
      : 'season'
    const country = text(data.country ?? '', 10, false),
      region = text(data.region ?? '', 40, false).toLocaleLowerCase('ko'),
      ageBand = text(data.ageBand ?? '', 20, false)
    if (!countries.includes(country) || !AGE_BANDS.includes(ageBand) || (region && !country))
      return fail('순위 분류를 확인하세요.')
    const snapshot = (await db.doc('deskStandings/' + season.id).get()).data()
    if (!snapshot)
      return { entries: [], season: publicSeason(season), cohortPending: false, pending: true }
    const candidates = snapshot.rows as {
      uid: string
      returns: Record<string, number | null>
      drawdown: number
      trades: number
    }[]
    const profiles = candidates.length
      ? await db.getAll(...candidates.map((r) => db.doc('deskProfiles/' + r.uid)))
      : []
    const rows = candidates
      .map((row, i) => ({ ...row, profile: profiles[i]?.data() as Profile | undefined }))
      .filter(
        (row) =>
          row.profile?.publicRanking &&
          row.profile.status === 'active' &&
          typeof row.returns[period] === 'number' &&
          (!country || row.profile.country === country) &&
          (!region || row.profile.region === region) &&
          (!ageBand || row.profile.ageBand === ageBand)
      )
      .sort(
        (a, b) =>
          (b.returns[period] ?? 0) - (a.returns[period] ?? 0) ||
          String(a.uid).localeCompare(String(b.uid))
      )
    const cohortPending = Boolean((country || region || ageBand) && rows.length < 5)
    return {
      entries: cohortPending
        ? []
        : rows.map((r, i) => ({
            rank: i + 1,
            uid: r.uid,
            displayName: r.profile!.displayName,
            country: r.profile!.country,
            region: r.profile!.region,
            ageBand: r.profile!.ageBand,
            returnRate: r.returns[period],
            drawdown: r.drawdown,
            trades: r.trades,
            updatedAt: snapshot.at,
            tick: snapshot.tick,
          })),
      season: publicSeason(season),
      period,
      cohortPending,
      snapshotAt: snapshot.at,
      stale: now - snapshot.at > 120000 && season.state === 'active',
    }
  }
  const uid = requireMember(actor)
  if (op === 'profile') {
    const requested = profileInput(data.profile)
    return db.runTransaction(async (tx) => {
      await assertNotDeleting(tx, db, uid)
      const ref = db.doc('deskProfiles/' + uid),
        oldDoc = await tx.get(ref),
        accountDoc = await tx.get(db.doc('deskAccounts/' + uid))
      const old = oldDoc.data() as Profile | undefined,
        session = accountDoc.data() as Session | undefined
      const season = session
        ? ((await tx.get(db.doc('deskSeasons/' + session.seasonId))).data() as Season | undefined)
        : undefined
      if (
        old &&
        session &&
        season?.state === 'active' &&
        now < season.endsAt &&
        ['country', 'region', 'ageBand'].some(
          (k) => old[k as keyof Profile] !== requested[k as keyof Profile]
        )
      )
        throw new DeskError(
          'failed-precondition',
          '국가·지역·연령대는 참가한 시즌이 끝난 뒤 변경할 수 있습니다. 공개 동의는 언제든 철회할 수 있습니다.'
        )
      const profile = {
        ...requested,
        status: old?.status || 'active',
        // Only the server records participation. Legacy profiles remain conservative.
        hasJoinedSeason: oldDoc.exists ? old?.hasJoinedSeason !== false : false,
      }
      tx.set(ref, { ...profile, updatedAt: now })
      if (session && season) publish(tx, db, uid, season, session, profile, now)
      return profile
    })
  }
  if (op === 'join') {
    return db.runTransaction(async (tx) => {
      await assertNotDeleting(tx, db, uid)
      const c = (await tx.get(db.doc('deskControl/current'))).data() as Control | undefined
      if (!c?.activeSeasonId)
        throw new DeskError('failed-precondition', '운영 중인 공개 시즌이 없습니다.')
      const sRef = db.doc('deskSeasons/' + c.activeSeasonId),
        s = (await tx.get(sRef)).data() as Season | undefined
      const profile = (await tx.get(db.doc('deskProfiles/' + uid))).data() as Profile | undefined,
        aRef = db.doc('deskAccounts/' + uid),
        old = (await tx.get(aRef)).data() as Session | undefined
      if (!s || s.state !== 'active' || now < s.startsAt || now >= s.endsAt || !c.newOrdersEnabled)
        throw new DeskError('failed-precondition', '시즌 참가가 현재 중지돼 있습니다.')
      if (!profile || profile.status !== 'active')
        throw new DeskError('failed-precondition', '사용 가능한 프로필을 먼저 저장하세요.')
      if (old?.seasonId === s.id) return sessionView(s, old, now)
      if (old && old.account.status === 'active')
        throw new DeskError('failed-precondition', '이전 시즌 정산을 먼저 완료하세요.')
      if (s.members >= 100)
        throw new DeskError('resource-exhausted', '현재 시즌의 운영 정원(100명)에 도달했습니다.')
      const tick = tickAt(s, now),
        account = createAccount(s.scenario)
      account.startedTick = tick
      account.tick = tick
      account.endTick = s.horizon
      account.equityHistory = [
        { tick, equity: account.initialCapital, benchmark: account.initialCapital },
      ]
      const session: Session = {
        seasonId: s.id,
        account,
        revision: 0,
        receipts: [],
        updatedAt: now,
      }
      if (old) tx.set(db.doc('deskArchive/' + old.seasonId + '_' + uid), { ...old, uid })
      tx.update(db.doc('deskProfiles/' + uid), { hasJoinedSeason: true })
      tx.set(aRef, session)
      tx.update(sRef, { members: s.members + 1 })
      publish(tx, db, uid, s, session, profile, now)
      return sessionView(s, session, now)
    })
  }
  if (['sync', 'order', 'basket', 'cancel'].includes(op))
    return syncSession(db, uid, now, op === 'sync' ? undefined : data)
  if (op === 'chart') {
    const own = (await db.doc('deskAccounts/' + uid).get()).data() as Session | undefined
    if (!own) throw new DeskError('failed-precondition', '시즌에 먼저 참가하세요.')
    const season = (await db.doc('deskSeasons/' + own.seasonId).get()).data() as Season | undefined
    if (!season) throw new DeskError('not-found', '시즌을 찾을 수 없습니다.')
    return {
      instrumentId: id(data.instrumentId),
      candles: candles(
        id(data.instrumentId),
        marketAt(season, own.account.tick),
        Number(data.interval),
        60
      ),
    }
  }
  if (op === 'report') {
    const target = id(data.targetUid),
      category = text(data.category, 30),
      detail = text(data.detail, 1000)
    if (!['nickname', 'abuse', 'suspicious-trading', 'other'].includes(category))
      return fail('신고 유형이 올바르지 않습니다.')
    const { season } = await controlAndSeason(db)
    if (
      !season ||
      !(await db.doc('deskLeaderboard/' + season.id + '/entries/' + target).get()).exists
    )
      return fail('공개 시즌 참가자를 찾을 수 없습니다.')
    const key = createHash('sha256')
      .update(uid + ':' + target + ':' + Math.floor(now / 86400000))
      .digest('hex')
    await db.runTransaction(async (tx) => {
      await assertNotDeleting(tx, db, uid)
      await assertNotDeleting(tx, db, target)
      const ref = db.doc('deskReports/' + key)
      if ((await tx.get(ref)).exists)
        throw new DeskError('resource-exhausted', '이 참가자에 대한 신고가 이미 접수됐습니다.')
      tx.set(ref, {
        reporterUid: uid,
        targetUid: target,
        seasonId: season.id,
        category,
        detail,
        status: 'open',
        createdAt: now,
      })
    })
    return { accepted: true, id: key }
  }
  requireAdmin(actor)
  if (op === 'adminOverview') {
    const { control, season } = await controlAndSeason(db)
    const [reports, accounts, audit] = await Promise.all([
      db
        .collection('deskReports')
        .where('status', '==', 'open')
        .orderBy('createdAt', 'asc')
        .limit(100)
        .get(),
      db
        .collection('deskAccounts')
        .where('account.status', '==', 'active')
        .orderBy('updatedAt', 'asc')
        .limit(100)
        .get(),
      db.collection('deskAudit').orderBy('at', 'desc').limit(30).get(),
    ])
    return {
      control,
      season: publicSeason(season),
      reports: reports.docs.map((d) => ({ id: d.id, ...d.data() })),
      audit: audit.docs.map((d) => ({ id: d.id, ...d.data() })),
      accounts: accounts.size,
      staleAccounts: accounts.docs.filter(
        (d) => now - d.data().updatedAt > 120000 && d.data().account.status === 'active'
      ).length,
      capacity: 100,
    }
  }
  const reason = text(data.reason, 300),
    auditRef = db.collection('deskAudit').doc()
  if (op === 'adminFlags') {
    if (typeof data.newOrdersEnabled !== 'boolean') return fail('주문 상태를 지정하세요.')
    return db.runTransaction(async (tx) => {
      await assertNotDeleting(tx, db, uid)
      const ref = db.doc('deskControl/current'),
        old = ((await tx.get(ref)).data() as Control) || defaultControl()
      if (data.revision !== old.revision)
        throw new DeskError('aborted', '운영 설정이 변경됐습니다. 새로고침하세요.')
      const next = {
        ...old,
        newOrdersEnabled: data.newOrdersEnabled,
        message: text(data.message ?? '', 200, false),
        revision: old.revision + 1,
      }
      tx.set(ref, next)
      tx.set(auditRef, { actorUid: uid, action: op, reason, at: now, before: old, after: next })
      return next
    })
  }
  if (op === 'adminSeason') {
    const action = String(data.action)
    return db.runTransaction(async (tx) => {
      await assertNotDeleting(tx, db, uid)
      const ref = db.doc('deskControl/current'),
        control = ((await tx.get(ref)).data() as Control) || defaultControl()
      if (data.revision !== control.revision)
        throw new DeskError('aborted', '운영 설정이 변경됐습니다. 새로고침하세요.')
      const old = control.activeSeasonId
        ? ((await tx.get(db.doc('deskSeasons/' + control.activeSeasonId))).data() as
            Season | undefined)
        : undefined
      if (action === 'close') {
        if (!old || old.state !== 'active')
          throw new DeskError('failed-precondition', '종료할 활성 시즌이 없습니다.')
        tx.update(db.doc('deskSeasons/' + old.id), {
          state: 'closed',
          horizon: tickAt(old, now),
          endsAt: now,
        })
        tx.update(ref, { newOrdersEnabled: false, revision: control.revision + 1 })
        tx.set(auditRef, { actorUid: uid, action: 'season-close', target: old.id, reason, at: now })
        return { closed: old.id }
      }
      if (action !== 'create') return fail('시즌 작업을 확인하세요.')
      if (old?.state === 'active' && now < old.endsAt)
        throw new DeskError('failed-precondition', '기존 시즌을 먼저 종료하세요.')
      const title = text(data.title, 60),
        tickMs = Number(data.tickMs)
      if (![1000, 5000, 10000, 60000].includes(tickMs))
        return fail('지원하지 않는 시장 속도입니다.')
      const season: Season = {
        id: randomUUID(),
        title,
        seed: randomBytes(32).toString('hex'),
        scenario: 'sandbox',
        startsAt: now,
        endsAt: now + scenarioById('sandbox').horizon * tickMs,
        tickMs,
        horizon: scenarioById('sandbox').horizon,
        state: 'active',
        members: 0,
      }
      tx.set(db.doc('deskSeasons/' + season.id), season)
      tx.set(ref, {
        activeSeasonId: season.id,
        newOrdersEnabled: true,
        message: '',
        revision: control.revision + 1,
      })
      tx.set(auditRef, {
        actorUid: uid,
        action: 'season-create',
        target: season.id,
        reason,
        at: now,
      })
      return publicSeason(season)
    })
  }
  if (op === 'adminModerate') {
    const target = id(data.targetUid),
      action = String(data.action),
      reportId = data.reportId ? id(data.reportId) : null
    if (!['suspend', 'restore', 'resolve'].includes(action)) return fail('처리 유형을 확인하세요.')
    return db.runTransaction(async (tx) => {
      await assertNotDeleting(tx, db, uid)
      await assertNotDeleting(tx, db, target)
      const pRef = db.doc('deskProfiles/' + target),
        profile = (await tx.get(pRef)).data() as Profile | undefined
      const session = (await tx.get(db.doc('deskAccounts/' + target))).data() as Session | undefined
      const s = session
        ? ((await tx.get(db.doc('deskSeasons/' + session.seasonId))).data() as Season | undefined)
        : undefined
      const report = reportId ? await tx.get(db.doc('deskReports/' + reportId)) : null
      if (!profile || (report && report.data()?.targetUid !== target))
        return fail('대상 또는 신고를 찾을 수 없습니다.')
      if (action === 'suspend' && target === uid)
        return fail('자신의 운영 계정은 정지할 수 없습니다.')
      const next = {
        ...profile,
        status:
          action === 'suspend' ? 'suspended' : action === 'restore' ? 'active' : profile.status,
      }
      tx.set(pRef, { ...next, updatedAt: now }, { merge: true })
      if (session && s) publish(tx, db, target, s, session, next, now)
      if (reportId)
        tx.update(db.doc('deskReports/' + reportId), {
          status: 'resolved',
          resolvedAt: now,
          resolvedBy: uid,
          resolution: reason,
        })
      tx.set(auditRef, { actorUid: uid, action, target, reportId, reason, at: now })
      return { updated: true }
    })
  }
  return fail('지원하지 않는 서비스 요청입니다.')
}
export async function riskSweep(db: Firestore, now = Date.now()) {
  const accounts = await db
    .collection('deskAccounts')
    .where('account.status', '==', 'active')
    .orderBy('updatedAt', 'asc')
    .limit(100)
    .get()
  const { season } = await controlAndSeason(db)
  let updated = 0,
    failed = 0
  const rows: Record<string, unknown>[] = []
  for (const doc of accounts.docs) {
    try {
      const result = await syncSession(db, doc.id, now)
      updated++
      if (season && result.season?.id === season.id && !result.catchingUp)
        rows.push({
          uid: doc.id,
          returns: result.performance,
          drawdown: result.account.maxDrawdown,
          trades: result.account.trades,
        })
    } catch {
      failed++
    }
  }
  if (season) {
    // Completed accounts remain comparable at the season's closing tick. Insolvent
    // accounts cannot improve afterwards and retain their terminal loss.
    const terminal = await db.collection('deskAccounts').where('seasonId', '==', season.id).get()
    for (const doc of terminal.docs) {
      const session = doc.data() as Session
      if (session.account.status === 'active' || rows.some((r) => r.uid === doc.id)) continue
      const m = marketAt(season, session.account.tick)
      rows.push({
        uid: doc.id,
        returns: performance(session.account, m),
        drawdown: session.account.maxDrawdown,
        trades: session.account.trades,
      })
    }
    // Publish one atomic common-time snapshot; failed/catching-up accounts are excluded.
    await db.runTransaction(async (tx) => {
      const profiles = rows.length
        ? await tx.getAll(...rows.map((r) => db.doc('deskProfiles/' + r.uid)))
        : []
      const visible = rows.filter(
        (_, i) => profiles[i]?.exists && profiles[i].data()?.status !== 'deleting'
      )
      tx.set(db.doc('deskStandings/' + season.id), {
        at: now,
        tick: tickAt(season, now),
        rows: visible.slice(0, 100),
      })
    })
  }
  await db.doc('deskHealth/riskSweep').set({ at: now, updated, failed, scanned: accounts.size })
  return { updated, failed }
}
