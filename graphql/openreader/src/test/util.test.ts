import {toSnakeCase} from '@subsquid/util-naming'
import {POSTGRES_MAX_IDENTIFIER_LENGTH, toTable} from '../util/util'


describe('toTable', function() {
    it('snake_cases short entity names unchanged', function() {
        expect(toTable('Account')).toBe('account')
        expect(toTable('TokenTransfer')).toBe('token_transfer')
    })

    it('truncates names that exceed the identifier limit, matching typeorm-codegen', function() {
        // The physical table typeorm-codegen creates for this entity.
        const entity = 'LevrConfigProviderSchemaLiquidationBufferBpsOverUnderUpdated'
        const full = toSnakeCase(entity)
        expect(full.length).toBeGreaterThan(POSTGRES_MAX_IDENTIFIER_LENGTH)

        const table = toTable(entity)
        expect(table.length).toBe(POSTGRES_MAX_IDENTIFIER_LENGTH)
        expect(table).toBe(full.slice(0, POSTGRES_MAX_IDENTIFIER_LENGTH))
        expect(table).toBe('levr_config_provider_schema_liquidation_buffer_bps_over_under_u')
    })

    it('leaves a name exactly at the limit unchanged (boundary)', function() {
        const entity = 'A' + 'a'.repeat(62) // snake length 63
        expect(toSnakeCase(entity).length).toBe(POSTGRES_MAX_IDENTIFIER_LENGTH)
        expect(toTable(entity)).toBe(toSnakeCase(entity))
    })

    it('truncates a name one byte over the limit (boundary)', function() {
        const entity = 'A' + 'a'.repeat(63) // snake length 64
        expect(toSnakeCase(entity).length).toBe(POSTGRES_MAX_IDENTIFIER_LENGTH + 1)
        expect(toTable(entity).length).toBe(POSTGRES_MAX_IDENTIFIER_LENGTH)
    })
})
