import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, ManyToOne as ManyToOne_} from "typeorm"
import * as marshal from "./marshal"
import {Account} from "./account.model"

/**
 *  All transfers 
 */
@Index_(["block", "extrinsicId"], {unique: false})
@Entity_()
export class Transfer {
    constructor(props?: Partial<Transfer>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @Column_("bytea", {nullable: false})
    from!: Uint8Array

    @Column_("bytea", {nullable: false})
    to!: Uint8Array

    @Index_()
    @ManyToOne_(() => Account, {nullable: true})
    fromAccount!: Account | undefined | null

    @Index_()
    @ManyToOne_(() => Account, {nullable: true})
    toAccount!: Account | undefined | null

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    value!: bigint

    @Column_("text", {nullable: true})
    comment!: string | undefined | null

    @Column_("int4", {nullable: false})
    block!: number

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    tip!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    timestamp!: bigint

    @Column_("timestamp with time zone", {nullable: false})
    insertedAt!: Date

    @Column_("text", {nullable: true})
    extrinsicId!: string | undefined | null
}
