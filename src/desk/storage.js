import { createAccount, validateAccount } from './core'
export const SAVE_KEY = 'marketdesk.v2'
const MAX_BYTES = 1024 * 1024
export function freshPractice(scenario = 'foundation') {
  return {
    version: 2,
    seed: crypto.randomUUID(),
    account: createAccount(scenario, 390),
    revision: 0,
    history: [],
    savedAt: Date.now(),
  }
}
export function parsePractice(raw) {
  if (typeof raw !== 'string' || raw.length > MAX_BYTES)
    throw new Error('저장 파일은 1MB 이하여야 합니다.')
  const p = JSON.parse(raw)
  if (
    p.version !== 2 ||
    typeof p.seed !== 'string' ||
    !/^[\w-]{8,128}$/.test(p.seed) ||
    !Number.isSafeInteger(p.revision) ||
    p.revision < 0 ||
    !Array.isArray(p.history) ||
    p.history.length > 12
  )
    throw new Error('지원하지 않는 연습 저장 형식입니다.')
  return {
    version: 2,
    seed: p.seed,
    account: validateAccount(p.account),
    revision: p.revision,
    history: p.history
      .filter(
        (h) =>
          typeof h.scenario === 'string' &&
          Number.isFinite(h.returnRate) &&
          typeof h.completed === 'boolean'
      )
      .map((h) => ({
        scenario: h.scenario.slice(0, 30),
        returnRate: h.returnRate,
        completed: h.completed,
        medals: Math.max(0, Math.min(3, Number(h.medals) || 0)),
      })),
    savedAt: Number(p.savedAt) || 0,
  }
}
export function readPractice() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    return { practice: raw ? parsePractice(raw) : freshPractice(), storageError: '' }
  } catch {
    return {
      practice: freshPractice(),
      storageError:
        '저장을 읽을 수 없습니다. 기존 원본을 보존하고 임시 연습을 열었습니다. 백업을 내려받거나 복구 파일을 가져오세요.',
    }
  }
}
export async function persistPractice(previous, next) {
  const save = () => {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw && parsePractice(raw).revision !== previous.revision)
      throw new Error('다른 탭에서 연습 기록이 변경됐습니다. 이 탭을 새로고침하세요.')
    const result = { ...next, revision: previous.revision + 1, savedAt: Date.now() }
    const serialized = JSON.stringify(result)
    if (serialized.length > MAX_BYTES)
      throw new Error('저장 용량을 초과했습니다. 기록을 내려받으세요.')
    if (raw) localStorage.setItem(SAVE_KEY + '.backup', raw)
    localStorage.setItem(SAVE_KEY, serialized)
    return result
  }
  if (navigator.locks) return navigator.locks.request(SAVE_KEY, save)
  return save()
}
export function downloadSave(practice, original = false) {
  const body = original
    ? localStorage.getItem(SAVE_KEY) || JSON.stringify(practice)
    : JSON.stringify(practice, null, 2)
  const url = URL.createObjectURL(new Blob([body], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'marketdesk-practice.json'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
