import {describe, expect, it} from 'vitest'
import {bool, bytes, fixedSizeArray, string, struct, uint256} from '@subsquid/evm-codec'
import {event as _event, indexed, keccak256} from '..'

// Pre-computed static event topic (the value itself is arbitrary for
// these tests — we only care that the event round-trips whatever topic
// is given to it).
const TOPIC = `0x${'ab'.repeat(32)}`

const hex = (b: Buffer) => `0x${b.toString('hex')}`
const u256Bytes = (n: bigint) => {
    const b = Buffer.alloc(32)
    let v = BigInt.asUintN(256, n)
    for (let i = 31; i >= 0; i--) {
        b[i] = Number(v & 0xffn)
        v >>= 8n
    }
    return b
}

describe('Event', () => {
    it('decodes a simple record produced by encode', () => {
        const event = _event(TOPIC, {
            a: indexed(uint256),
            b: uint256,
        })
        const value = {a: 123n, b: 100n}
        expect(event.decode(event.encode(value))).toEqual(value)
    })

    it('hashes indexed string / bytes per spec and exposes the hash on decode', () => {
        const event = _event(TOPIC, {
            a: indexed(string),
            b: string,
            c: bytes,
            d: struct({_0: uint256, _1: string}),
            e: indexed(bool),
        })

        const value = {
            a: 'hello',
            b: 'hello',
            c: '0x1234',
            d: {_0: 100n, _1: 'world'},
            e: true,
        }
        const rec = event.encode(value)

        // First topic is the event signature, then one topic per indexed field.
        expect(rec.topics[0]).toBe(TOPIC)
        expect(rec.topics).toHaveLength(3)
        // `a` is hashed (`string` is a reference type).
        expect(rec.topics[1]).toBe(hex(keccak256(Buffer.from('hello', 'utf8'))))
        // `e` is a value type — encoded directly.
        expect(rec.topics[2]).toBe(`0x${'00'.repeat(31)}01`)

        // Decoding gives back the hash word for `a`, original values otherwise.
        expect(event.decode(rec)).toEqual({...value, a: rec.topics[1]})
    })

    it('topicSelection() without filter returns topic0 only', () => {
        const event = _event(TOPIC, {
            a: indexed(uint256),
            b: uint256,
        })
        expect(event.topicSelection()).toEqual({topic0: [TOPIC]})
    })

    it('topicSelection() encodes indexed value-type field values to 32-byte hex', () => {
        const event = _event(TOPIC, {
            a: indexed(uint256),
            b: indexed(uint256),
            c: uint256,
        })
        const filter = event.topicSelection({a: [1n, 2n]})
        expect(filter.topic0).toEqual([TOPIC])
        expect(filter.topic1).toHaveLength(2)
        expect(filter.topic1![0]).toMatch(/^0x[0-9a-f]{64}$/)
        expect(filter.topic1![1]).toMatch(/^0x[0-9a-f]{64}$/)
        expect(filter.topic2).toBeUndefined()
    })

    it('topicSelection() hashes indexed reference-type values', () => {
        const event = _event(TOPIC, {
            tag: indexed(string),
        })
        const expected = hex(keccak256(Buffer.from('hi', 'utf8')))
        expect(event.topicSelection({tag: ['hi']}).topic1).toEqual([expected])
    })

    it('topicSelection() places values at the correct topic position', () => {
        const event = _event(TOPIC, {
            from: indexed(uint256),
            to: indexed(uint256),
            value: uint256,
        })
        const filter = event.topicSelection({to: [1n]})
        expect(filter.topic1).toBeUndefined()
        expect(filter.topic2).toHaveLength(1)
    })

    it('hashes indexed fixed-size arrays per spec (no length prefix, padded elements)', () => {
        const event = _event(TOPIC, {
            a: indexed(fixedSizeArray(uint256, 3)),
            b: uint256,
        })

        const arr = [1n, 2n, 3n]
        const expectedHash = hex(
            keccak256(Buffer.concat([u256Bytes(1n), u256Bytes(2n), u256Bytes(3n)])),
        )

        const rec = event.encode({a: arr, b: 7n})
        expect(rec.topics).toHaveLength(2)
        expect(rec.topics[1]).toBe(expectedHash)

        // `b` round-trips, `a` collapses to its hash word.
        expect(event.decode(rec)).toEqual({a: expectedHash, b: 7n})

        const filter = event.topicSelection({a: [arr]})
        expect(filter.topic1).toEqual([expectedHash])
    })

    it('hashes indexed static structs per spec', () => {
        const event = _event(TOPIC, {
            a: indexed(struct({x: uint256, y: uint256})),
        })

        const value = {x: 5n, y: 9n}
        const expectedHash = hex(keccak256(Buffer.concat([u256Bytes(5n), u256Bytes(9n)])))

        const rec = event.encode({a: value})
        expect(rec.topics[1]).toBe(expectedHash)
        expect(event.decode(rec)).toEqual({a: expectedHash})
    })

    it('throws on topic count / signature mismatch', () => {
        const event = _event(TOPIC, {
            a: indexed(uint256),
            b: uint256,
        })
        const rec = event.encode({a: 1n, b: 2n})

        expect(() => event.decode({topics: [rec.topics[0]], data: rec.data})).toThrow()
        expect(() =>
            event.decode({topics: [`0x${'00'.repeat(32)}`, rec.topics[1]], data: rec.data}),
        ).toThrow()
        expect(() => event.decode({topics: [], data: '0x'})).toThrow()
    })
})
