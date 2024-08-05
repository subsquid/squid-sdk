import {
    Entity,
    ManyToOne,
    PrimaryColumn,
    JSONColumn,
    IntColumn,
    DateTimeColumn,
    BytesColumn,
    BigIntColumn, StringColumn, BooleanColumn
} from '../../decorators';


@Entity('item')
export class Item {
    @PrimaryColumn()
    id!: string

    @StringColumn( { nullable: true })
    name?: string

    constructor(id?: string, name?: string) {
        if (id != null) {
            this.id = id
            this.name = name
        }
    }
}

@Entity('order')
export class Order {
    @PrimaryColumn()
    id!: string

    @ManyToOne(() => Item, {nullable: true})
    item!: Item

    @IntColumn({nullable: false})
    qty!: number
}

@Entity('data')
export class Data {
    @PrimaryColumn()
    id!: string

    @BooleanColumn( { nullable: true })
    bool?: boolean | null

    @StringColumn( { nullable: true })
    text?: string | null

    @StringColumn({array: true, nullable: true})
    textArray?: string[] | null

    @IntColumn({nullable: true})
    integer?: number | null

    @IntColumn({array: true, nullable: true})
    integerArray?: number[] | null

    @BigIntColumn({nullable: true})
    bigInteger?: bigint | null

    @DateTimeColumn({nullable: true})
    dateTime?: Date | null

    @BytesColumn({nullable: true})
    bytes?: Uint8Array | null

    @JSONColumn({nullable: true})
    json?: unknown | null

    @ManyToOne(() => Item, {nullable: true})
    item?: Item | null

    constructor(props?: Partial<Data>) {
        Object.assign(this, props)
    }
}
