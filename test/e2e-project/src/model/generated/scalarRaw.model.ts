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

  @Column_("numeric", {nullable: true})
  float!: number | undefined | null

  @Column_("jsonb", {transformer: {to: obj => obj == null ? undefined : obj.toJSON(), from: obj => obj == null ? undefined : new NestedScalars(undefined, obj)}, nullable: true})
  nested!: NestedScalars | undefined | null
}
