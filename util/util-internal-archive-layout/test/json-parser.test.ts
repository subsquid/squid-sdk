import {describe, it} from 'vitest'
import assert from 'node:assert'
import {parseJsonBytes} from '../src/json-parser'

function roundTrip(value: unknown): unknown {
    let json = JSON.stringify(value)
    let buf = Buffer.from(json, 'utf8')
    return parseJsonBytes(buf)
}

describe('parseJsonBytes', () => {
    it('parses null', () => {
        assert.strictEqual(parseJsonBytes(Buffer.from('null')), null)
    })

    it('parses booleans', () => {
        assert.strictEqual(parseJsonBytes(Buffer.from('true')), true)
        assert.strictEqual(parseJsonBytes(Buffer.from('false')), false)
    })

    it('parses integers', () => {
        assert.strictEqual(parseJsonBytes(Buffer.from('0')), 0)
        assert.strictEqual(parseJsonBytes(Buffer.from('42')), 42)
        assert.strictEqual(parseJsonBytes(Buffer.from('-1')), -1)
        assert.strictEqual(parseJsonBytes(Buffer.from('9007199254740991')), 9007199254740991)
    })

    it('parses floats', () => {
        assert.strictEqual(parseJsonBytes(Buffer.from('3.14')), 3.14)
        assert.strictEqual(parseJsonBytes(Buffer.from('-0.5')), -0.5)
        assert.strictEqual(parseJsonBytes(Buffer.from('1e10')), 1e10)
        assert.strictEqual(parseJsonBytes(Buffer.from('1.5e-3')), 1.5e-3)
        assert.strictEqual(parseJsonBytes(Buffer.from('2E+5')), 2e5)
    })

    it('parses strings', () => {
        assert.strictEqual(parseJsonBytes(Buffer.from('""')), '')
        assert.strictEqual(parseJsonBytes(Buffer.from('"hello"')), 'hello')
        assert.strictEqual(parseJsonBytes(Buffer.from('"hello world"')), 'hello world')
    })

    it('parses string escapes', () => {
        assert.strictEqual(parseJsonBytes(Buffer.from('"a\\"b"')), 'a"b')
        assert.strictEqual(parseJsonBytes(Buffer.from('"a\\\\b"')), 'a\\b')
        assert.strictEqual(parseJsonBytes(Buffer.from('"a\\/b"')), 'a/b')
        assert.strictEqual(parseJsonBytes(Buffer.from('"a\\bb"')), 'a\bb')
        assert.strictEqual(parseJsonBytes(Buffer.from('"a\\fb"')), 'a\fb')
        assert.strictEqual(parseJsonBytes(Buffer.from('"a\\nb"')), 'a\nb')
        assert.strictEqual(parseJsonBytes(Buffer.from('"a\\rb"')), 'a\rb')
        assert.strictEqual(parseJsonBytes(Buffer.from('"a\\tb"')), 'a\tb')
    })

    it('parses unicode escapes', () => {
        assert.strictEqual(parseJsonBytes(Buffer.from('"\\u0041"')), 'A')
        assert.strictEqual(parseJsonBytes(Buffer.from('"\\u00e9"')), 'é')
        assert.strictEqual(parseJsonBytes(Buffer.from('"\\uD83D\\uDE00"')), '😀')
    })

    it('parses utf8 strings directly', () => {
        assert.strictEqual(parseJsonBytes(Buffer.from('"café"')), 'café')
        assert.strictEqual(parseJsonBytes(Buffer.from('"😀"')), '😀')
        assert.strictEqual(parseJsonBytes(Buffer.from('"日本語"')), '日本語')
    })

    it('parses empty array', () => {
        assert.deepStrictEqual(parseJsonBytes(Buffer.from('[]')), [])
    })

    it('parses arrays', () => {
        assert.deepStrictEqual(parseJsonBytes(Buffer.from('[1, "two", null, true]')), [1, 'two', null, true])
    })

    it('parses nested arrays', () => {
        assert.deepStrictEqual(parseJsonBytes(Buffer.from('[[1, 2], [3, 4]]')), [
            [1, 2],
            [3, 4],
        ])
    })

    it('parses empty object', () => {
        assert.deepStrictEqual(parseJsonBytes(Buffer.from('{}')), {})
    })

    it('parses objects', () => {
        let result = parseJsonBytes(Buffer.from('{"a":1,"b":"two","c":null}')) as Record<string, unknown>
        assert.strictEqual(result.a, 1)
        assert.strictEqual(result.b, 'two')
        assert.strictEqual(result.c, null)
    })

    it('parses nested objects', () => {
        let json = '{"a":{"b":{"c":1}},"d":[{"e":2},{"f":3}]}'
        assert.deepStrictEqual(parseJsonBytes(Buffer.from(json)), JSON.parse(json))
    })

    it('parses complex block-like objects', () => {
        let obj = {
            hash: '0xabc123',
            number: 12345,
            transactions: [
                {hash: '0xdef456', from: '0x111', to: '0x222', value: '0x0', input: '0x'},
                {hash: '0xghi789', from: '0x333', to: '0x444', value: '0x100', input: '0xabcd'},
            ],
            logs: [],
            stateDiffs: null,
        }
        let json = JSON.stringify(obj)
        assert.deepStrictEqual(parseJsonBytes(Buffer.from(json)), obj)
    })

    it('round-trips all JS value types through JSON.stringify + parseJsonBytes', () => {
        let values: unknown[] = [
            null,
            true,
            false,
            0,
            -1,
            3.14,
            '',
            'hello',
            'with\nnewline',
            'with"quote',
            'with\\backslash',
            {a: 1, b: [2, 3, null], c: {d: 'hello'}},
            [],
            {},
            [1, 'two', null, true, {a: 1}, [2, 3]],
        ]
        for (let v of values) {
            assert.deepStrictEqual(roundTrip(v), v, `round-trip failed for: ${JSON.stringify(v)}`)
        }
    })

    it('handles whitespace around values', () => {
        assert.strictEqual(parseJsonBytes(Buffer.from('  null  ')), null)
        assert.deepStrictEqual(parseJsonBytes(Buffer.from('  [ 1 , 2 ]  ')), [1, 2])
    })

    it('throws on invalid JSON', () => {
        assert.throws(() => parseJsonBytes(Buffer.from('')), SyntaxError)
        assert.throws(() => parseJsonBytes(Buffer.from('{]')), SyntaxError)
        assert.throws(() => parseJsonBytes(Buffer.from('[1,]')), SyntaxError)
        assert.throws(() => parseJsonBytes(Buffer.from('undefined')), SyntaxError)
    })

    it('parses a buffer larger than V8 MAX_STRING_LENGTH threshold', () => {
        let largeArr = Array.from({length: 100000}, (_, i) => ({
            hash: `0x${i.toString(16).padStart(64, '0')}`,
            number: i,
            data: 'x'.repeat(100),
        }))
        let json = JSON.stringify(largeArr)
        let buf = Buffer.from(json, 'utf8')
        let parsed = parseJsonBytes(buf) as typeof largeArr
        assert.strictEqual(parsed.length, largeArr.length)
        assert.strictEqual(parsed[0].hash, largeArr[0].hash)
        assert.strictEqual(parsed[99999].hash, largeArr[99999].hash)
    })
})
