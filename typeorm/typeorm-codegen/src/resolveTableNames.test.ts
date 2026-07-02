import type {Model} from '@subsquid/openreader/lib/model'
import {toSnakeCase} from '@subsquid/util-naming'
import assert from 'assert'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {resolveTableNames} from './codegen'


// `resolveTableNames` only reads `model[name].kind` and the key, so we can feed
// it bare literals instead of building full openreader models.
function model(...names: string[]): Model {
    const m: Model = {}
    for (const n of names) m[n] = {kind: 'entity'} as any
    return m
}

// The real over-long entity from PR #514: 69-char snake table name, pinned here.
const LONG_ENTITY = 'LevrConfigProviderSchemaLiquidationBufferBpsOverUnderUpdated'
const LONG_FULL = 'levr_config_provider_schema_liquidation_buffer_bps_over_under_updated'
const LONG_TRUNC = 'levr_config_provider_schema_liquidation_buffer_bps_over_under_u'


describe('resolveTableNames', () => {
    // Silence (and capture) the truncation warnings the logger writes to stderr.
    let stderr: ReturnType<typeof vi.spyOn>
    const warned = () => stderr.mock.calls.map((c: any) => String(c[0])).join('')

    beforeEach(() => {
        stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true)
    })
    afterEach(() => vi.restoreAllMocks())

    it('maps entity names to snake_case', () => {
        const r = resolveTableNames(model('MyEntity', 'TokenTransfer'))
        expect(r.size).toBe(2)
        expect(r.get('MyEntity')).toBe('my_entity')
        expect(r.get('TokenTransfer')).toBe('token_transfer')
    })

    it('excludes non-entity kinds', () => {
        const m: Model = {
            Real: {kind: 'entity'} as any,
            Obj: {kind: 'object'} as any,
            En: {kind: 'enum'} as any,
            Uni: {kind: 'union'} as any,
            Search: {kind: 'fts'} as any,
        }
        const r = resolveTableNames(m)
        expect(r.size).toBe(1)
        expect([...r.keys()]).toEqual(['Real'])
    })

    it('keeps a 63-char table name unchanged (boundary)', () => {
        const name = 'A' + 'a'.repeat(62) // snake length 63
        assert.strictEqual(toSnakeCase(name).length, 63)
        const r = resolveTableNames(model(name))
        const table = r.get(name)!
        expect(table).toBe(toSnakeCase(name))
        expect(table.length).toBe(63)
    })

    it('truncates a 64-char table name to 63 (boundary)', () => {
        const name = 'A' + 'a'.repeat(63) // snake length 64
        assert.strictEqual(toSnakeCase(name).length, 64)
        const table = resolveTableNames(model(name)).get(name)!
        expect(table.length).toBe(63)
        expect(table).toBe(toSnakeCase(name).slice(0, 63))
    })

    it('truncation is the 63-char prefix of the full name', () => {
        const name = 'A' + 'a'.repeat(63)
        const full = toSnakeCase(name)
        const table = resolveTableNames(model(name)).get(name)!
        expect(full.startsWith(table)).toBe(true)
        expect(table).toBe(full.slice(0, 63))
    })

    it('truncates the real-world 69-char name to the exact expected value', () => {
        assert.strictEqual(toSnakeCase(LONG_ENTITY), LONG_FULL)
        assert.strictEqual(LONG_FULL.length, 69)
        const table = resolveTableNames(model(LONG_ENTITY)).get(LONG_ENTITY)!
        expect(table).toBe(LONG_TRUNC)
        expect(table.length).toBe(63)
    })

    it('throws on collision after truncation', () => {
        // Two distinct 64+/65-char names that both truncate to `a`.repeat(63).
        const a = 'A' + 'a'.repeat(63) // snake `a`*64
        const b = 'A' + 'a'.repeat(64) // snake `a`*65
        const fn = () => resolveTableNames(model(a, b))
        expect(fn).toThrow(/both map to table name/)
        expect(fn).toThrow(/after truncation to 63 bytes/)
        expect(fn).toThrow(new RegExp(`"${a}"`))
        expect(fn).toThrow(new RegExp(`"${b}"`))
    })

    it('throws on collision without truncation', () => {
        // FooBar and Foo_bar both snake to `foo_bar`.
        assert.strictEqual(toSnakeCase('FooBar'), toSnakeCase('Foo_bar'))
        let err: Error | undefined
        try {
            resolveTableNames(model('FooBar', 'Foo_bar'))
        } catch (e) {
            err = e as Error
        }
        expect(err).toBeInstanceOf(Error)
        expect(err!.message).toMatch(/both map to table name "foo_bar"/)
        expect(err!.message).not.toContain('after truncation')
    })

    it('warns on truncation', () => {
        const overLong = 'A' + 'a'.repeat(63)
        resolveTableNames(model(overLong))
        expect(warned()).toContain('exceeds the PostgreSQL identifier')
        expect(warned()).toContain(overLong)
    })

    it('stays silent when nothing is truncated', () => {
        resolveTableNames(model('A' + 'a'.repeat(62))) // 63 chars, not truncated
        expect(warned()).toBe('')
    })
})
