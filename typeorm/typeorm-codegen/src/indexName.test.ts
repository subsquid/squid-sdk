import {describe, expect, it} from 'vitest'
import {makeIndexName} from './codegen'


describe('makeIndexName', () => {
    it('has the form idx_<entity>_<fields>_<8-hex-hash>', () => {
        const name = makeIndexName('Transfer', ['amount'], false)
        expect(name).toMatch(/^idx_transfer_amount_[0-9a-f]{8}$/)
    })

    it('snake_cases the entity and field names in the readable prefix', () => {
        const name = makeIndexName('TokenTransfer', ['blockNumber', 'logIndex'], false)
        expect(name).toMatch(/^idx_token_transfer_block_number_log_index_[0-9a-f]{8}$/)
    })

    it('is deterministic', () => {
        expect(makeIndexName('Foo', ['a', 'b'], false)).toBe(makeIndexName('Foo', ['a', 'b'], false))
    })

    it('distinguishes unique from non-unique indexes on the same fields', () => {
        expect(makeIndexName('Foo', ['a'], true)).not.toBe(makeIndexName('Foo', ['a'], false))
    })

    it('distinguishes column order', () => {
        expect(makeIndexName('Foo', ['a', 'b'], false)).not.toBe(makeIndexName('Foo', ['b', 'a'], false))
    })

    it('distinguishes different entities with the same fields', () => {
        expect(makeIndexName('Foo', ['a'], false)).not.toBe(makeIndexName('Bar', ['a'], false))
    })

    it('never exceeds the PostgreSQL identifier limit, even for very long names', () => {
        const entity = 'A'.repeat(80)
        const fields = ['someVeryLongColumnName', 'anotherVeryLongColumnName', 'yetAnotherOne']
        const name = makeIndexName(entity, fields, false)
        expect(name.length).toBeLessThanOrEqual(63)
        expect(name).toMatch(/_[0-9a-f]{8}$/) // hash suffix survives truncation
    })

    it('stays unique after the readable prefix is truncated', () => {
        // Two entities sharing a long common prefix but differing past the cutoff
        // still get distinct names thanks to the hash of the full identity.
        const a = makeIndexName('X'.repeat(70) + 'Alpha', ['f'], false)
        const b = makeIndexName('X'.repeat(70) + 'Beta', ['f'], false)
        expect(a).not.toBe(b)
    })
})
