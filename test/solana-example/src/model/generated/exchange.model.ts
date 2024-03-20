import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class Exchange {
    constructor(props?: Partial<Exchange>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("int4", {nullable: false})
    slot!: number

    @Column_("text", {nullable: false})
    tx!: string

    @Column_("timestamp with time zone", {nullable: false})
    timestamp!: Date

    @Column_("text", {nullable: false})
    fromOwner!: string

    @Column_("text", {nullable: false})
    fromToken!: string

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    fromAmount!: bigint

    @Column_("text", {nullable: false})
    toOwner!: string

    @Column_("text", {nullable: false})
    toToken!: string

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    toAmount!: bigint
}
