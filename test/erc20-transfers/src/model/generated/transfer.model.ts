import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, IntColumn as IntColumn_, DateTimeColumn as DateTimeColumn_, StringColumn as StringColumn_, ManyToOne as ManyToOne_, Index as Index_, BigIntColumn as BigIntColumn_} from "@subsquid/typeorm-store"
import {Account} from "./account.model"

@Entity_()
export class Transfer {
    constructor(props?: Partial<Transfer>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @IntColumn_({nullable: false})
    blockNumber!: number

    @DateTimeColumn_({nullable: false})
    timestamp!: Date

    @StringColumn_({nullable: false})
    tx!: string

    @Index_()
    @ManyToOne_(() => Account, {nullable: true, createForeignKeyConstraints: false})
    from!: Account | undefined | null

    @Index_()
    @ManyToOne_(() => Account, {nullable: true, createForeignKeyConstraints: false})
    to!: Account | undefined | null

    @BigIntColumn_({nullable: false})
    amount!: bigint
}
