import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "../marshal"
import {Account} from "./account.model"

/**
 *  All transfers 
 */
@Entity_()
export class Transfer {
  constructor(props?: Partial<Transfer>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("bytea", {nullable: false})
  from!: Buffer

  @Column_("bytea", {nullable: false})
  to!: Buffer

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

  @Column_("integer", {nullable: false})
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
