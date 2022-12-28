import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"

@Index_(["from", "to"], {unique: false})
@Index_(["timestamp", "from", "to"], {unique: false})
@Entity_()
export class Transfer {
    constructor(props?: Partial<Transfer>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    timestamp!: bigint

    @Column_("text", {nullable: false})
    from!: string

    @Column_("text", {nullable: false})
    to!: string

    @Index_()
    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    amount!: BigDecimal

    @Column_("text", {array: true, nullable: true})
    tags!: (string)[] | undefined | null
}
