import { useCallback, useEffect, useRef, useState } from 'react'
import {
  advanceAccount,
  placeOrder,
  placeBasket,
  cancelOrder,
  valuation,
  performance,
  objectives,
  INSTRUMENTS,
  quote,
} from './core'
import { freshPractice, parsePractice, persistPractice, readPractice, SAVE_KEY } from './storage'
import { api, configured, observeAuth } from './client'
export function useDesk() {
  const [initial] = useState(readPractice),
    [practice, setPractice] = useState(initial.practice)
  const [storageError, setStorageError] = useState(initial.storageError),
    [notice, setNotice] = useState(''),
    [error, setError] = useState('')
  const [mode, setMode] = useState('practice'),
    [busy, setBusy] = useState(false),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1)
  const [user, setUser] = useState(null),
    [cloud, setCloud] = useState(null),
    [session, setSession] = useState(null)
  const lock = useRef(false),
    practiceRef = useRef(practice),
    uncertain = useRef(null)
  practiceRef.current = practice
  const run = useCallback(async (action) => {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      return await action()
    } catch (e) {
      setError(e.message || '요청을 처리하지 못했습니다.')
      setPlaying(false)
    } finally {
      lock.current = false
      setBusy(false)
    }
  }, [])
  const refresh = useCallback(async () => {
    const data = await api({ op: 'bootstrap' })
    setCloud(data)
    setSession(data.session)
    return data
  }, [])
  useEffect(() => {
    let generation = 0
    const stop = observeAuth((u) => {
      const current = ++generation
      setUser(u)
      setCloud(null)
      setSession(null)
      setMode('practice')
      uncertain.current = null
      if (configured && u)
        api({ op: 'bootstrap' })
          .then((data) => {
            if (generation === current) {
              setCloud(data)
              setSession(data.session)
            }
          })
          .catch((e) => {
            if (generation === current) setError(e.message)
          })
    })
    return () => {
      generation++
      stop()
    }
  }, [])
  useEffect(() => {
    const cleared = (event) => {
      if (event.key === SAVE_KEY && event.newValue === null) {
        const next = freshPractice()
        practiceRef.current = next
        setPractice(next)
        setPlaying(false)
        setStorageError('')
        setNotice('다른 탭에서 연습 기록을 삭제했습니다.')
      }
    }
    addEventListener('storage', cleared)
    return () => removeEventListener('storage', cleared)
  }, [])
  async function save(next) {
    if (storageError) {
      setPractice(next)
      setNotice('임시 연습 중입니다. 저장 오류를 해결하거나 파일로 내려받으세요.')
      return
    }
    try {
      const result = await persistPractice(practiceRef.current, next)
      practiceRef.current = result
      setPractice(result)
    } catch (e) {
      setStorageError(e.message)
      setPractice(next)
      throw e
    }
  }
  const mutate = (action) =>
    run(async () => {
      const old = practiceRef.current
      await save({ ...old, account: action(old) })
    })
  const step = (ticks) =>
    mutate((p) =>
      advanceAccount(
        p.account,
        { seed: p.seed, scenario: p.account.scenario },
        Math.min(p.account.endTick, p.account.tick + ticks)
      )
    )
  useEffect(() => {
    if (!playing || mode !== 'practice' || practice.account.status !== 'active') return
    const timer = setInterval(() => {
      if (!lock.current) step(speed)
    }, 1000)
    return () => clearInterval(timer)
    // step always reads the latest practice through practiceRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed, mode, practice.account.status, storageError])
  useEffect(() => {
    if (mode !== 'online' || !session || !user) return
    const timer = setInterval(
      () =>
        run(async () => {
          const result = await api({ op: 'sync' })
          setSession(result)
        }),
      10000
    )
    return () => clearInterval(timer)
  }, [mode, Boolean(session), user, run]) // eslint-disable-line react-hooks/exhaustive-deps
  const account = mode === 'online' && session ? session.account : practice.account
  const market = { seed: practice.seed, scenario: account.scenario, tick: account.tick }
  const summary = mode === 'online' ? session?.summary : valuation(account, market)
  const returns = mode === 'online' ? session?.performance : performance(account, market)
  const goals = mode === 'online' ? session?.objectives : objectives(account, market)
  const prices =
    mode === 'online'
      ? session?.market.prices
      : Object.fromEntries(INSTRUMENTS.map((a) => [a.id, quote(a.id, market).price]))
  async function command(op, payload) {
    if (mode === 'practice')
      return mutate((p) =>
        op === 'order'
          ? placeOrder(p.account, { ...market, seed: p.seed, tick: p.account.tick }, payload.order)
          : op === 'basket'
            ? placeBasket(
                p.account,
                { ...market, seed: p.seed, tick: p.account.tick },
                payload.orders
              )
            : cancelOrder(p.account, payload.orderId)
      )
    return run(async () => {
      // A transport failure retains exactly the same id/payload. No automatic replay
      // with a new id, even if the first response was lost after a committed order.
      const request = uncertain.current || {
        op,
        ...payload,
        revision: session.revision,
        seasonId: session.season.id,
        requestId: crypto.randomUUID(),
      }
      uncertain.current = request
      try {
        const result = await api(request)
        uncertain.current = null
        setSession(result)
        setNotice(
          result.catchingUp
            ? result.message
            : result.duplicate
              ? '이미 처리된 요청을 확인했습니다.'
              : '서버에서 주문을 처리했습니다.'
        )
      } catch (e) {
        if (
          !['functions/unavailable', 'functions/deadline-exceeded', 'functions/internal'].includes(
            e.code
          )
        )
          uncertain.current = null
        await refresh().catch(() => {})
        throw e
      }
    })
  }
  async function startScenario(id) {
    setPlaying(false)
    return run(async () => {
      const old = practiceRef.current,
        m = { seed: old.seed, scenario: old.account.scenario, tick: old.account.tick }
      const history = [
        {
          scenario: old.account.scenario,
          returnRate: valuation(old.account, m).returnRate,
          completed: old.account.status === 'completed',
          medals:
            old.account.status === 'completed'
              ? objectives(old.account, m).filter((g) => g.complete).length
              : 0,
        },
        ...old.history,
      ].slice(0, 12)
      await save({ ...freshPractice(id), history })
      setMode('practice')
      setNotice('새 캠페인을 시작했습니다. 이전 결과는 투자 일지에 보관했습니다.')
    })
  }
  async function importSave(file) {
    return run(async () => {
      if (!file || file.size > 1024 * 1024)
        throw new Error('1MB 이하의 연습 저장 파일을 선택하세요.')
      const next = parsePractice(await file.text())
      const restore = () => {
        const raw = localStorage.getItem(SAVE_KEY)
        if (raw) localStorage.setItem(SAVE_KEY + '.backup', raw)
        const result = {
          ...next,
          revision: Math.max(next.revision, practiceRef.current.revision) + 1,
          savedAt: Date.now(),
        }
        localStorage.setItem(SAVE_KEY, JSON.stringify(result))
        practiceRef.current = result
        setPractice(result)
        setStorageError('')
      }
      if (navigator.locks) await navigator.locks.request(SAVE_KEY, restore)
      else restore()
      setMode('practice')
      setPlaying(false)
      setNotice('연습 기록을 가져왔습니다. 공개 순위에는 반영되지 않습니다.')
    })
  }
  async function join() {
    return run(async () => {
      const result = await api({ op: 'join' })
      setSession(result)
      setMode('online')
      setPlaying(false)
      setNotice('공개 시즌에 참가했습니다. 시간과 계좌는 서버에서 관리합니다.')
    })
  }
  return {
    account,
    market,
    summary,
    returns,
    goals,
    prices,
    practice,
    mode,
    busy,
    playing,
    setPlaying,
    speed,
    setSpeed,
    step,
    command,
    startScenario,
    importSave,
    notice,
    error,
    storageError,
    user,
    cloud,
    session,
    configured,
    run,
    refresh,
    join,
    setNotice,
    setError,
    setMode: (value) => {
      setPlaying(false)
      if (value === 'online' && !session) {
        setNotice('계정 화면에서 공개 시즌에 참가하세요.')
        return
      }
      setMode(value)
    },
    pendingRequest: Boolean(uncertain.current),
  }
}
