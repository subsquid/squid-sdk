import {Column as Column_, Column, Entity, ManyToOne, PrimaryColumn} from 'typeorm'
import {BigDecimal} from '@subsquid/big-decimal'
import * as marshal from './marshal'

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

    @Column('numeric', {transformer: marshal.bigintTransformer})
    bigInteger?: bigint | null

    @Column_("numeric", {transformer: {to: obj => obj == null ? undefined : obj.map((val: any) => val == null ? undefined : marshal.bigint.toJSON(val)), from: obj => obj == null ? undefined : marshal.fromList(obj, val => val == null ? undefined : marshal.bigint.fromJSON(val))}, array: true, nullable: true})
    bigIntegerArray?: bigint[] | null

    @Column('numeric', {transformer: marshal.bigdecimalTransformer})
    bigDecimal?: BigDecimal | null

    @Column_("numeric", {transformer: {to: obj => obj == null ? undefined : obj.map((val: any) => val == null ? undefined : marshal.bigdecimal.toJSON(val)), from: obj => obj == null ? undefined : marshal.fromList(obj, val => val == null ? undefined : marshal.bigdecimal.fromJSON(val))}, array: true, nullable: true})
    bigDecimalArray?: BigDecimal[] | null

    @Column('timestamp with time zone')
    dateTime?: Date | null

    @Column('bytea')
    bytes?: Uint8Array | null

    @Column_("jsonb", {nullable: true})
    json?: unknown | null

    @ManyToOne(() => Item)
    item?: Item | null
}
