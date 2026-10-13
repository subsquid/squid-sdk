import {afterEach, describe, expect, it} from 'vitest'
import {generateOrmModels} from './codegen'
import {cleanupAll, makeOutDir, modelFromSchema, readGenerated} from './codegen.support'


function generate(schema: string) {
    const {dir, root} = makeOutDir()
    generateOrmModels(modelFromSchema(schema), dir)
    return (file: string) => readGenerated(root, file)
}


afterEach(() => {
    cleanupAll()
})


describe('generateOrmModels — composite primary keys', () => {
    it('emits no primary option for a default single-column key', () => {
        const out = generate(`
            type Transfer @entity {
                id: ID!
                timestamp: DateTime!
            }
        `)('transfer.model.ts')
        expect(out).toContain('@PrimaryColumn_()')
        expect(out).toContain('@DateTimeColumn_({nullable: false})')
        expect(out).not.toContain('primary')
    })

    it('generates identical output for an explicit pk of ["id"]', () => {
        const plain = generate(`type Transfer @entity { id: ID! ts: DateTime! }`)('transfer.model.ts')
        const explicit = generate(`type Transfer @entity(pk: ["id"]) { id: ID! ts: DateTime! }`)('transfer.model.ts')
        expect(explicit).toBe(plain)
    })

    it('marks the extra key column primary, leaving id on @PrimaryColumn_', () => {
        const out = generate(`
            type Transfer @entity(pk: ["id", "timestamp"]) {
                id: ID!
                timestamp: DateTime!
                amount: BigInt!
            }
        `)('transfer.model.ts')
        expect(out).toContain('@PrimaryColumn_()')
        expect(out).toContain('@DateTimeColumn_({primary: true, nullable: false})')
        // Non-key columns are untouched.
        expect(out).toContain('@BigIntColumn_({nullable: false})')
    })

    it('marks every extra key column of a 3-column key', () => {
        const out = generate(`
            type Transfer @entity(pk: ["id", "timestamp", "block"]) {
                id: ID!
                timestamp: DateTime!
                block: Int!
            }
        `)('transfer.model.ts')
        expect(out).toContain('@DateTimeColumn_({primary: true, nullable: false})')
        expect(out).toContain('@IntColumn_({primary: true, nullable: false})')
    })

    it('marks an enum key column primary', () => {
        const out = generate(`
            enum Network { ETHEREUM POLYGON }
            type Transfer @entity(pk: ["id", "network"]) {
                id: ID!
                network: Network!
            }
        `)('transfer.model.ts')
        expect(out).toMatch(/@Column_\("varchar", \{primary: true, length: \d+, nullable: false\}\)/)
    })

    it('keeps index annotations on a key column', () => {
        const out = generate(`
            type Transfer @entity(pk: ["id", "timestamp"]) {
                id: ID!
                timestamp: DateTime! @index
            }
        `)('transfer.model.ts')
        expect(out).toContain('@Index_(')
        expect(out).toContain('@DateTimeColumn_({primary: true, nullable: false})')
    })
})
