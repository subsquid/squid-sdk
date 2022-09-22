import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "./marshal"
import {NestedScalars} from "./_nestedScalars"

@Entity_()
export class ScalarRaw {
  constructor(props?: Partial<ScalarRaw>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("numeric", {transformer: marshal.floatTransformer, nullable: true})
  float!: number | undefined | null

  @Column_("jsonb", {transformer: {to: obj => obj == null ? undefined : obj.toJSON(), from: obj => obj == null ? undefined : new NestedScalars(undefined, obj)}, nullable: true})
  nested!: NestedScalars | undefined | null

  @Column_("jsonb", {nullable: true})
  json!: unknown | undefined | null

  @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: true})
  bigdecimal!: BigDecimal | undefined | null
}
