import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class Transfer {
  constructor(props?: Partial<Transfer>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: true})
  from!: string | undefined | null

  @Column_("text", {nullable: true})
  to!: string | undefined | null

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  value!: bigint

  @Column_("int4", {nullable: false})
  timestamp!: number

  @Column_("int4", {nullable: false})
  block!: number
}
