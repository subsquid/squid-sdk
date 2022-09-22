import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, ManyToOne as ManyToOne_} from "typeorm"
import * as marshal from "./marshal"
import {Account} from "./account.model"

@Entity_()
export class Transfer {
  constructor(props?: Partial<Transfer>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Index_()
  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  timestamp!: bigint

  @Index_()
  @ManyToOne_(() => Account, {nullable: true})
  from!: Account

  @Index_()
  @ManyToOne_(() => Account, {nullable: true})
  to!: Account

  @Index_()
  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
  amount!: BigDecimal
}
