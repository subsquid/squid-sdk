import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, BooleanColumn as BooleanColumn_, DateTimeColumn as DateTimeColumn_, BigIntColumn as BigIntColumn_, BigDecimalColumn as BigDecimalColumn_, BytesColumn as BytesColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class Scalar {
    constructor(props?: Partial<Scalar>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @BooleanColumn_({nullable: true})
    bool!: boolean | undefined | null

    @DateTimeColumn_({nullable: true})
    date!: Date | undefined | null

    @BigIntColumn_({nullable: true})
    bigInt!: bigint | undefined | null

    @BigDecimalColumn_({nullable: true})
    bigDecimal!: BigDecimal | undefined | null

    @BytesColumn_({nullable: true})
    bytes!: Uint8Array | undefined | null
}
