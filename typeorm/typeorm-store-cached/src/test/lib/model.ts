import {Column as Column_, Column, Entity, ManyToOne, PrimaryColumn} from 'typeorm'


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

    constructor(opts: Order) {
        Object.assign(this, opts)
    }
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

    @Column('numeric', {transformer: {from: (s?: string) => s == null ? null : BigInt(s), to: (val?: bigint) => val?.toString()}})
    bigInteger?: bigint | null

    @Column('timestamp with time zone')
    dateTime?: Date | null

    @Column('bytea')
    bytes?: Uint8Array | null

    @Column_("jsonb", {nullable: true})
    json?: unknown | null

    @ManyToOne(() => Item)
    item?: Item | null
}
