import {describe, expect, it} from 'vitest'
import {bool, bytes, string, struct, uint256} from '@subsquid/evm-codec'
import {event as _event, indexed} from '..'

// Pre-computed static event topic (the value itself is arbitrary for
// these tests — we only care that the event round-trips whatever topic
// is given to it).
const TOPIC = `0x${'ab'.repeat(32)}`

describe('Event', () => {
    it('decodes a simple record produced by encode', () => {
        const event = _event(TOPIC, {
            a: indexed(uint256),
            b: uint256,
        })
        const value = {a: 123n, b: 100n}
        expect(event.decode(event.encode(value))).toEqual(value)
    })

    it('decodes complex args', () => {
        // For indexed dynamic types (string, bytes, tuples) the topic is a
        // hash of the original value, not the value itself — on decode we
        // get that hash back verbatim. So the test input for those fields
        // is the hash word directly.
        const indexedStringHash = `0x${'12'.repeat(32)}`

        const event = _event(TOPIC, {
            a: indexed(string),
            b: string,
            c: bytes,
            d: struct({_0: uint256, _1: string}),
            e: indexed(bool),
        })

        const value = {
            a: indexedStringHash,
            b: 'hello',
            c: '0x1234',
            d: {_0: 100n, _1: 'world'},
            e: true,
        }
        const rec = event.encode(value)

        // Sanity-check the structure: first topic is the event signature,
        // then one topic per indexed field in declaration order.
        expect(rec.topics[0]).toBe(TOPIC)
        expect(rec.topics).toHaveLength(3)

        expect(event.decode(rec)).toEqual(value)
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
