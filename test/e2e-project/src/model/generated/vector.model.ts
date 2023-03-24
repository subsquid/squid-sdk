import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"

@Entity_()
export class Vector {
    constructor(props?: Partial<Vector>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("numeric", {array: true, nullable: false})
    bigdecimal!: (BigDecimal | undefined | null)[]

    @Column_("numeric", {array: true, nullable: false})
    bigint!: (bigint | undefined | null)[]
}
