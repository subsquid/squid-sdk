import {Column as Column_, Column, Entity, ManyToOne, PrimaryColumn} from 'typeorm'

@Entity()
export class IdOnly {
    @PrimaryColumn()
    id!: string

    constructor(id?: string) {
        if (id != null) {
            this.id = id
        }
    }
}

@Entity()
export class Item {
    @PrimaryColumn()
    id!: string

    @Column()
    name?: string

    constructor(id?: string, name?: string) {
        if (id != null) {
            this.id = id
            this.name = name
        }
    }
}

@Entity()
export class Order {
    @PrimaryColumn()
    id!: string

    @ManyToOne(() => Item, {nullable: true})
    item!: Item

    @Column({nullable: false})
    qty!: number
}

@Entity()
export class Data {
    constructor(props?: Partial<Data>) {
        Object.assign(this, props)
    }

    @PrimaryColumn()
    id!: string

    @Column('text')
    text?: string | null

    @Column('text', {array: true})
    textArray?: string[] | null

    @Column('int4')
    integer?: number | null

    @Column('int4', {array: true})
    integerArray?: number[] | null

    @Column('numeric', {
        transformer: {from: (s?: string) => (s == null ? null : BigInt(s)), to: (val?: bigint) => val?.toString()},
    })
    bigInteger?: bigint | null

    @Column('timestamp with time zone')
    dateTime?: Date | null

    @Column('bytea')
    bytes?: Uint8Array | null

    @Column_('jsonb', {nullable: true})
    json?: unknown | null

    @ManyToOne(() => Item)
    item?: Item | null
}

/**
 * Composite primary key, shaped as codegen emits it for
 * `@entity(pk: ["id", "timestamp"])`: `id` keeps its own primary column and the
 * extra key column is marked in place. Several rows may share an `id`,
 * distinguished by `timestamp`.
 */
@Entity()
export class Versioned {
    constructor(props?: Partial<Versioned>) {
        Object.assign(this, props)
    }

    @PrimaryColumn()
    id!: string

    @Column('timestamp with time zone', {primary: true})
    timestamp!: Date

    @Column('text', {nullable: true})
    value?: string | null
}

/**
 * Three-column key whose last column carries a value transformer — the change
 * log has to record the transformed (driver-facing) value, or an entity-derived
 * key would never match the row-derived one.
 */
@Entity()
export class VersionedWide {
    constructor(props?: Partial<VersionedWide>) {
        Object.assign(this, props)
    }

    @PrimaryColumn()
    id!: string

    @Column('timestamp with time zone', {primary: true})
    timestamp!: Date

    @Column('numeric', {
        primary: true,
        transformer: {from: (s?: string) => (s == null ? null : BigInt(s)), to: (val?: bigint) => val?.toString()},
    })
    seq!: bigint

    @Column('text', {nullable: true})
    value?: string | null
}
