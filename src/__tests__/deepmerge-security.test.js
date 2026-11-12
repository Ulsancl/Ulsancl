const merge = require('../../vendor/deepmerge/index.cjs')

describe('deepmerge prototype safety', () => {
    test.each(['target', 'source', 'nested'])('does not inherit attacker properties through %s', direction => {
        const payload = JSON.parse('{"__proto__":{"polluted":true}}')
        const result = direction === 'target' ? merge(payload, {})
            : direction === 'source' ? merge(Object.create(null), payload)
                : merge({ nested: payload }, { nested: {} }).nested
        expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
        expect(result.polluted).toBeUndefined()
        expect({}.polluted).toBeUndefined()
    })
    test('retains arrays, symbols and custom merge behavior', () => {
        const symbol = Symbol('tag')
        expect(merge({ list: [1], [symbol]: 'ok' }, { list: [2] })).toEqual({ list: [1, 2], [symbol]: 'ok' })
        expect(merge({ count: 1 }, { count: 2 }, { customMerge: key => key === 'count' ? (a, b) => a + b : undefined,
            isMergeableObject: () => true }).count).toBe(3)
    })
})

