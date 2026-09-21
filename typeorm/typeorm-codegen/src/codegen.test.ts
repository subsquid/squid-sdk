import {toCamelCase} from '@subsquid/util-naming'
import fs from 'fs'
import path from 'path'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {generateOrmModels} from './codegen'
import {cleanupAll, listGenerated, makeOutDir, modelFromSchema, readGenerated} from './codegen.support'


const LONG_ENTITY = 'LevrConfigProviderSchemaLiquidationBufferBpsOverUnderUpdated'
const LONG_TRUNC = 'levr_config_provider_schema_liquidation_buffer_bps_over_under_u'


// Generate models for `schema` into a temp dir and return a reader over the output.
function generate(schema: string) {
    const {dir, root} = makeOutDir()
    generateOrmModels(modelFromSchema(schema), dir)
    return {
        root,
        read: (file: string) => readGenerated(root, file),
        files: () => listGenerated(root),
    }
}


// Silence (and capture) the truncation warnings the logger writes to stderr.
let stderr: ReturnType<typeof vi.spyOn>
const warned = () => stderr.mock.calls.map((c: any) => String(c[0])).join('')

beforeEach(() => {
    stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true)
})
afterEach(() => {
    vi.restoreAllMocks()
    cleanupAll()
})


describe('generateOrmModels — entity table name pruning (PR #514)', () => {
    it('emits a bare @Entity_() for a normal-length entity', () => {
        const model = generate(`type Account @entity { id: ID! }`).read('account.model.ts')
        expect(model).toContain('@Entity_()')
        expect(model).not.toContain('@Entity_("')
    })

    it('pins an explicit truncated table name for an over-long entity', () => {
        const g = generate(`type ${LONG_ENTITY} @entity { id: ID! }`)
        const model = g.read(`${toCamelCase(LONG_ENTITY)}.model.ts`)
        expect(model).toContain(`@Entity_("${LONG_TRUNC}")`)
        // the class keeps the full, untruncated name
        expect(model).toContain(`export class ${LONG_ENTITY}`)
    })

    it('warns when it truncates an over-long entity', () => {
        generate(`type ${LONG_ENTITY} @entity { id: ID! }`)
        expect(warned()).toContain('exceeds the PostgreSQL identifier')
        expect(warned()).toContain(LONG_ENTITY)
    })

    it('copies marshal.ts into the output dir', () => {
        const {root} = generate(`
            type Foo @entity { id: ID! meta: Meta }
            type Meta { tag: String }
        `)
        const copied = path.join(root, 'marshal.ts')
        expect(fs.existsSync(copied)).toBe(true)
        const source = fs.readFileSync(path.join(__dirname, 'marshal.ts'), 'utf8')
        expect(fs.readFileSync(copied, 'utf8')).toBe(source)
    })
})


// docs-beta/en/sdk/squid-sdk/reference/schema-file/entities.mdx (+ intro.mdx)
describe('scalars, id and nullability', () => {
    const schema = `
        type Scalar @entity {
            id: ID!
            required: Int!
            boolean: Boolean
            string: String
            int: Int
            float: Float
            enum: Enum
            bigint: BigInt
            bigdecimal: BigDecimal
            dateTime: DateTime
            bytes: Bytes
            json: JSON
            deep: DeepScalar
        }
        type DeepScalar { bigint: BigInt }
        enum Enum { A B C }
    `

    it('maps every scalar to the right column decorator', () => {
        const m = generate(schema).read('scalar.model.ts')
        expect(m).toContain('@PrimaryColumn_()')
        expect(m).toContain('@BooleanColumn_({nullable: true})')
        expect(m).toContain('@StringColumn_({nullable: true})')
        expect(m).toContain('@IntColumn_({nullable: true})')
        expect(m).toContain('@FloatColumn_({nullable: true})')
        expect(m).toContain('@BigIntColumn_({nullable: true})')
        expect(m).toContain('@BytesColumn_({nullable: true})')
        expect(m).toContain('@DateTimeColumn_({nullable: true})')
        expect(m).toContain('@JSONColumn_({nullable: true})')
        expect(m).toContain('@BigDecimalColumn_({nullable: true})')
        expect(m).toContain('import {BigDecimal} from "@subsquid/big-decimal"')
    })

    it('honors non-null vs nullable fields', () => {
        const m = generate(schema).read('scalar.model.ts')
        expect(m).toMatch(/@IntColumn_\(\{nullable: false\}\)\s+required!: number\b/)
        expect(m).toMatch(/string!: string \| undefined \| null/)
    })

    it('maps enums to a varchar column and generates the enum module', () => {
        const g = generate(schema)
        expect(g.read('scalar.model.ts')).toContain('@Column_("varchar", {length: 1, nullable: true})')
        expect(g.read('scalar.model.ts')).toContain('import {Enum} from "./_enum"')
        const en = g.read('_enum.ts')
        expect(en).toContain('export enum Enum {')
        expect(en).toContain('A = "A",')
    })

    it('maps a user-defined (non-entity) type to a jsonb column', () => {
        const m = generate(schema).read('scalar.model.ts')
        expect(m).toContain('@Column_("jsonb", {transformer:')
        expect(m).toContain('import * as marshal from "./marshal"')
    })
})


// entities.mdx — Arrays
describe('arrays', () => {
    const schema = `
        type Lists @entity {
            id: ID!
            intArray: [Int!]!
            enumArray: [Enum!]
            datetimeArray: [DateTime!]
            bytesArray: [Bytes!]
            listOfListsOfInt: [[Int]]
            listOfJsonObjects: [Foo!]
        }
        enum Enum { A B C }
        type Foo { foo: Int bar: Int }
    `

    it('maps scalar and enum arrays to array columns', () => {
        const m = generate(schema).read('lists.model.ts')
        expect(m).toContain('@IntColumn_({array: true, nullable: false})')
        expect(m).toContain('@Column_("varchar", {length: 1, array: true, nullable: true})')
        expect(m).toContain('@DateTimeColumn_({array: true, nullable: true})')
        expect(m).toContain('@BytesColumn_({array: true, nullable: true})')
    })

    it('maps nested lists and object lists to jsonb columns', () => {
        const m = generate(schema).read('lists.model.ts')
        const jsonb = m.match(/@Column_\("jsonb"/g) ?? []
        expect(jsonb.length).toBe(2) // listOfListsOfInt + listOfJsonObjects
    })

    it('rejects native BigInt / BigDecimal arrays', () => {
        const {dir} = makeOutDir()
        const model = modelFromSchema(`type Foo @entity { id: ID! nums: [BigInt!]! }`)
        expect(() => generateOrmModels(model, dir)).toThrow(/unsupported type.*BigInt/)
    })
})


// indexes-and-constraints.mdx
describe('indexes and constraints', () => {
    it('emits a named index for @index and a named unique index for @unique', () => {
        const m = generate(`
            type Transfer @entity {
                id: ID!
                amount: BigInt! @index
                fee: BigInt! @index @unique
            }
        `).read('transfer.model.ts')
        expect(m).toMatch(/@Index_\("idx_transfer_amount_[0-9a-f]{8}"\)/)
        expect(m).toMatch(/@Index_\("idx_transfer_fee_[0-9a-f]{8}", \{unique: true\}\)/)
    })

    it('emits type-level composite indexes and skips the redundant single-column index', () => {
        const m = generate(`
            type Foo @entity @index(fields: ["foo", "bar"]) @index(fields: ["bar", "baz"]) {
                id: ID!
                bar: Int!
                baz: String!
                foo: String!
            }
        `).read('foo.model.ts')
        expect(m).toMatch(/@Index_\("idx_foo_foo_bar_[0-9a-f]{8}", \["foo", "bar"\], \{unique: false\}\)/)
        expect(m).toMatch(/@Index_\("idx_foo_bar_baz_[0-9a-f]{8}", \["bar", "baz"\], \{unique: false\}\)/)
        // columns that only lead composites get no extra single-column index
        expect(m.match(/@Index_\(/g)).toHaveLength(2)
    })

    it('supports unique composite indexes', () => {
        const m = generate(`
            type Extrinsic @entity @index(fields: ["hash", "block"], unique: true) {
                id: ID!
                hash: String! @unique
                block: String!
            }
        `).read('extrinsic.model.ts')
        expect(m).toMatch(/@Index_\("idx_extrinsic_hash_block_[0-9a-f]{8}", \["hash", "block"\], \{unique: true\}\)/)
    })
})


// entity-relations.mdx
describe('entity relations and inverse lookups', () => {
    const schema = `
        type Account @entity {
            id: ID!
            balance: BigInt!
            user: User @derivedFrom(field: "account")
            transfersTo: [Transfer!] @derivedFrom(field: "to")
        }
        type User @entity {
            id: ID!
            account: Account! @unique
            username: String!
        }
        type Transfer @entity {
            id: ID!
            to: Account!
            from: Account!
            amount: BigInt!
        }
    `

    it('maps a many-to-one FK to a named @Index_ + @ManyToOne_', () => {
        const m = generate(schema).read('transfer.model.ts')
        expect(m).toMatch(/@Index_\("idx_transfer_to_[0-9a-f]{8}"\)/)
        expect(m).toContain('@ManyToOne_(() => Account, {nullable: true})')
    })

    it('maps an owning @unique relation to @OneToOne_ + @JoinColumn_', () => {
        const m = generate(schema).read('user.model.ts')
        expect(m).toMatch(/@Index_\("idx_user_account_[0-9a-f]{8}", \{unique: true\}\)/)
        expect(m).toContain('@OneToOne_(() => Account, {nullable: true})')
        expect(m).toContain('@JoinColumn_()')
    })

    it('maps @derivedFrom to virtual @OneToMany_ / @OneToOne_ lookups (no columns)', () => {
        const m = generate(schema).read('account.model.ts')
        expect(m).toContain('@OneToMany_(() => Transfer, e => e.to)')
        expect(m).toContain('@OneToOne_(() => User, e => e.account)')
        // inverse-lookup fields are virtual — no stored column / join column here
        expect(m).not.toContain('@Column_')
        expect(m).not.toContain('@JoinColumn_')
    })

    it('models a many-to-many join entity as two many-to-one FKs', () => {
        const m = generate(`
            type TradeToken @entity {
                id: ID!
                trade: Trade!
                token: Token!
            }
            type Token @entity {
                id: ID!
                symbol: String!
                trades: [TradeToken!]! @derivedFrom(field: "token")
            }
            type Trade @entity {
                id: ID!
                tokens: [TradeToken!]! @derivedFrom(field: "trade")
            }
        `).read('tradeToken.model.ts')
        expect(m).toContain('@ManyToOne_(() => Trade, {nullable: true})')
        expect(m).toContain('@ManyToOne_(() => Token, {nullable: true})')
    })
})


// interfaces.mdx
describe('@query interfaces', () => {
    const g = () => generate(`
        interface MyEntity @query {
            id: ID!
            name: String
        }
        type Foo implements MyEntity @entity {
            id: ID!
            name: String
            foo: Int
        }
    `)

    it('produces no model file for the interface', () => {
        const files = g().files()
        expect(files).toContain('foo.model.ts')
        expect(files.some(f => /myentity/i.test(f))).toBe(false)
    })

    it('still generates entities that implement the interface, and the barrel omits it', () => {
        const gen = g()
        expect(gen.read('foo.model.ts')).toContain('export class Foo')
        const index = gen.read('index.ts')
        expect(index).toContain('export * from "./foo.model"')
        expect(index).not.toMatch(/myentity/i)
    })
})


// unions-and-typed-json.mdx
describe('unions and typed JSON', () => {
    const schema = `
        type User @entity { id: ID! login: String! }
        type Farmer { user: User! crop: Int }
        type Degen { user: User! bag: String }
        union Owner = Farmer | Degen
        type NFT @entity { id: ID! name: String! owner: Owner! }
    `

    it('generates a discriminated union module', () => {
        const u = generate(schema).read('_owner.ts')
        expect(u).toContain('export type Owner = Farmer | Degen')
        expect(u).toContain('export function fromJsonOwner(')
        expect(u).toContain(`case 'Farmer': return new Farmer(undefined, json)`)
    })

    it('generates typed-JSON classes with an isTypeOf discriminator', () => {
        const f = generate(schema).read('_farmer.ts')
        expect(f).toContain(`public readonly isTypeOf = 'Farmer'`)
        expect(f).toContain('toJSON()')
        // a JSON type may reference an entity (User) — emitted as its id string
        expect(f).toContain('import {User} from "./user.model"')
    })

    it('stores a union-typed field as a jsonb column using the union marshaller', () => {
        const m = generate(schema).read('nft.model.ts')
        expect(m).toContain('@Column_("jsonb", {transformer:')
        expect(m).toContain('fromJsonOwner(obj)')
    })
})


// Stable, readable, collision-free index names across every index-producing
// schema-file feature (field @index/@unique, composite @index, FK, unique FK).
describe('stable index names', () => {
    // one schema exercising every kind of generated index
    const schema = `
        type Order @entity @index(fields: ["seller", "createdAt"]) @index(fields: ["region", "createdAt"], unique: true) {
            id: ID!
            status: Status! @index
            price: BigInt! @index @unique
            region: String!
            createdAt: DateTime!
            seller: Account!
            shipper: Account!
            invoice: Invoice! @unique
        }
        type Account @entity { id: ID! }
        type Invoice @entity { id: ID! }
        enum Status { OPEN FILLED }
    `

    const NAME = /"(idx_[a-z0-9_]+_[0-9a-f]{8})"/g

    function indexNames(model: string): string[] {
        return [...model.matchAll(NAME)].map(m => m[1])
    }

    it('names every generated index as idx_<readable>_<8-hex-hash>', () => {
        const m = generate(schema).read('order.model.ts')
        const names = indexNames(m)
        // two composites + enum field @index + scalar field @unique + m2o FK + unique FK
        expect(names).toHaveLength(6)
        expect(names).toEqual(expect.arrayContaining([
            expect.stringMatching(/^idx_order_seller_created_at_[0-9a-f]{8}$/), // composite
            expect.stringMatching(/^idx_order_region_created_at_[0-9a-f]{8}$/), // unique composite
            expect.stringMatching(/^idx_order_status_[0-9a-f]{8}$/),            // enum field @index
            expect.stringMatching(/^idx_order_price_[0-9a-f]{8}$/),             // scalar field @index @unique
            expect.stringMatching(/^idx_order_shipper_[0-9a-f]{8}$/),           // m2o FK
            expect.stringMatching(/^idx_order_invoice_[0-9a-f]{8}$/),           // unique FK (o2o)
        ]))
    })

    it('keeps every index name within the PostgreSQL identifier limit', () => {
        const m = generate(schema).read('order.model.ts')
        for (const name of indexNames(m)) expect(name.length).toBeLessThanOrEqual(63)
    })

    it('produces unique names for every index in the schema', () => {
        const m = generate(schema).read('order.model.ts')
        const names = indexNames(m)
        expect(new Set(names).size).toBe(names.length)
    })

    it('is stable — regenerating the same schema yields identical names', () => {
        const first = indexNames(generate(schema).read('order.model.ts'))
        const second = indexNames(generate(schema).read('order.model.ts'))
        expect(second).toEqual(first)
    })

    it('stays within 63 bytes for an entity whose name already overflows', () => {
        const m = generate(`
            type ${LONG_ENTITY} @entity { id: ID! amount: BigInt! @index }
        `).read(`${toCamelCase(LONG_ENTITY)}.model.ts`)
        const names = indexNames(m)
        expect(names).toHaveLength(1)
        expect(names[0].length).toBeLessThanOrEqual(63)
        expect(names[0]).toMatch(/^idx_.+_[0-9a-f]{8}$/)
    })
})
