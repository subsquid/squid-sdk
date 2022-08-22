import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "./marshal"
import {TransactionData, fromJsonTransactionData} from "./_transactionData"

@Entity_()
export class Transaction {
  constructor(props?: Partial<Transaction>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("int4", {nullable: false})
  block!: number

  @Column_("timestamp with time zone", {nullable: false})
  timestamp!: Date

  @Column_("text", {nullable: false})
  from!: string

  @Column_("text", {nullable: false})
  to!: string

  @Column_("text", {nullable: false})
  txHash!: string

  @Column_("int4", {nullable: false})
  type!: number

  @Column_("jsonb", {nullable: false})
  input!: unknown

  @Column_("jsonb", {transformer: {to: obj => obj == null ? undefined : obj.toJSON(), from: obj => obj == null ? undefined : fromJsonTransactionData(obj)}, nullable: true})
  data!: TransactionData | undefined | null
}
