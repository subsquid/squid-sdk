import {BigIntColumn, DateTimeColumn, Entity, IntColumn, PrimaryColumn, StringColumn} from '@subsquid/typeorm-store'


@Entity()
export class Exchange {
    constructor(props?: Partial<Exchange>) {
        Object.assign(this, props)
    }

    @PrimaryColumn()
    id!: string

    @IntColumn({nullable: false})
    slot!: number

    @StringColumn({nullable: false})
    tx!: string

    @DateTimeColumn({nullable: false})
    timestamp!: Date

    @StringColumn()
    fromOwner!: string | undefined | null

    @StringColumn({nullable: false})
    fromToken!: string

    @BigIntColumn({nullable: false})
    fromAmount!: bigint

    @StringColumn()
    toOwner!: string | undefined | null

    @StringColumn({nullable: false})
    toToken!: string

    @BigIntColumn({nullable: false})
    toAmount!: bigint
}
