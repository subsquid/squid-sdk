import {describe, it} from 'vitest'
import assert from 'node:assert'
import {writeJson} from '../src/json-stream'

function stream(value: unknown): string {
    let chunks: string[] = []
    writeJson(value, (s) => chunks.push(s))
    return chunks.join('')
}

function maxChunkSize(value: unknown): number {
    let maxSize = 0
    writeJson(value, (s) => {
        if (s.length > maxSize) maxSize = s.length
    })
    return maxSize
}

describe('writeJson', () => {
    it('matches JSON.stringify for primitives', () => {
        let cases: unknown[] = [
            null,
            true,
            false,
            0,
            -1,
            42,
            3.14,
            -0,
            1e20,
            '',
            'hello',
            'with\nnewline',
            'with"quote',
            'with\\backslash',
            'with\u0000null',
            'unicode\u00e9\u00f1',
            'emoji\uD83D\uDE00',
        ]
        for (let c of cases) {
            assert.strictEqual(stream(c), JSON.stringify(c), `primitive: ${typeof c} ${String(c)}`)
        }
    })

    it('handles NaN and Infinity like JSON.stringify', () => {
        assert.strictEqual(stream(Number.NaN), 'null')
        assert.strictEqual(stream(Number.POSITIVE_INFINITY), 'null')
        assert.strictEqual(stream(Number.NEGATIVE_INFINITY), 'null')
    })

    it('handles undefined and functions like JSON.stringify', () => {
        assert.strictEqual(stream(undefined), 'null')
        assert.strictEqual(
            stream(() => {}),
            'null',
        )
        assert.strictEqual(stream(Symbol('x')), 'null')
    })

    it('matches JSON.stringify for simple objects', () => {
        let obj = {a: 1, b: 'hello', c: null, d: true}
        assert.strictEqual(stream(obj), JSON.stringify(obj))
    })

    it('omits undefined and function values from objects', () => {
        let obj: Record<string, unknown> = {a: 1, b: undefined, c: () => {}, d: 'kept'}
        assert.strictEqual(stream(obj), JSON.stringify(obj))
    })

    it('matches JSON.stringify for nested objects', () => {
        let obj = {a: {b: {c: 1}}, d: [{e: 2}, {f: 3}]}
        assert.strictEqual(stream(obj), JSON.stringify(obj))
    })

    it('matches JSON.stringify for arrays', () => {
        let arr = [1, 'two', null, true, {a: 1}, [2, 3]]
        assert.strictEqual(stream(arr), JSON.stringify(arr))
    })

    it('converts undefined and function array elements to null', () => {
        let arr = [1, undefined, 2, () => {}, 3]
        assert.strictEqual(stream(arr), JSON.stringify(arr))
    })

    it('matches JSON.stringify for empty containers', () => {
        assert.strictEqual(stream({}), JSON.stringify({}))
        assert.strictEqual(stream([]), JSON.stringify([]))
    })

    it('handles objects with toJSON', () => {
        let obj = {
            name: 'test',
            ts: {
                toJSON() {
                    return '2024-01-01'
                },
            },
        }
        assert.strictEqual(stream(obj), JSON.stringify(obj))
    })

    it('handles arrays with toJSON elements', () => {
        let arr = [
            {
                toJSON() {
                    return 'x'
                },
            },
            2,
        ]
        assert.strictEqual(stream(arr), JSON.stringify(arr))
    })

    it('handles deeply nested structures', () => {
        let deep: unknown = {level: 0}
        for (let i = 0; i < 50; i++) {
            deep = {nested: deep, level: i + 1}
        }
        assert.strictEqual(stream(deep), JSON.stringify(deep))
    })

    it('handles large arrays with small elements', () => {
        let arr = Array.from({length: 10000}, (_, i) => i)
        assert.strictEqual(stream(arr), JSON.stringify(arr))
    })

    it('emits small chunks: no single write approaches MAX_STRING_LENGTH', () => {
        let bigStr = 'x'.repeat(1000)
        let value = {key: bigStr}
        let result = stream(value)
        assert.strictEqual(result, JSON.stringify(value))
        assert.ok(maxChunkSize(value) < result.length + 100)
    })

    it('round-trips through JSON.parse', () => {
        let values: unknown[] = [
            {a: 1, b: [2, 3, null], c: {d: 'hello'}},
            [],
            {},
            {
                num: -0,
                inf: Number.POSITIVE_INFINITY,
                nan: Number.NaN,
                undef: undefined,
            },
            [null, true, false, 'test\nline'],
        ]
        for (let v of values) {
            assert.deepStrictEqual(JSON.parse(stream(v)), JSON.parse(JSON.stringify(v)))
        }
    })
})
