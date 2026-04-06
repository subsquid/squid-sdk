import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, IntColumn as IntColumn_, DateTimeColumn as DateTimeColumn_, StringColumn as StringColumn_, ManyToOne as ManyToOne_, Index as Index_, BigIntColumn as BigIntColumn_} from "@subsquid/typeorm-store"
import {DexType} from "./_dexType"
import {Account} from "./account.model"

@Entity_()
export class Swap {
    constructor(props?: Partial<Swap>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("varchar", {length: 9, nullable: false})
    dexType!: DexType

    @IntColumn_({nullable: false})
    blockNumber!: number

    @DateTimeColumn_({nullable: false})
    timestamp!: Date

    @StringColumn_({nullable: false})
    tx!: string

    @Index_()
    @ManyToOne_(() => Account, {nullable: true, createForeignKeyConstraints: false})
    sender!: Account | undefined | null

    @Index_()
    @ManyToOne_(() => Account, {nullable: true, createForeignKeyConstraints: false})
    to!: Account | undefined | null

    @BigIntColumn_({nullable: false})
    amount0In!: bigint

    @BigIntColumn_({nullable: false})
    amount1In!: bigint

    @BigIntColumn_({nullable: false})
    amount0Out!: bigint

    @BigIntColumn_({nullable: false})
    amount1Out!: bigint
}
