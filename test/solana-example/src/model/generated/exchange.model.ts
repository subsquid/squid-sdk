import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"

@Index_(["from", "to"], {unique: false})
@Index_(["timestamp", "from", "to"], {unique: false})
@Entity_()
export class Exchange {
    constructor(props?: Partial<Exchange>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("text", {nullable: false})
    tx!: string

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    timestamp!: bigint

    @Column_("text", {nullable: false})
    account!: string

    @Column_("text", {nullable: false})
    from!: string

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    fromAmount!: bigint

    @Column_("text", {nullable: false})
    to!: string

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    toAmount!: bigint
}
