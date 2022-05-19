import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class Flip {
  constructor(props?: Partial<Flip>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("bool", {nullable: false})
  value!: boolean

  @Column_("text", {nullable: false})
  caller!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  timestamp!: bigint
}
