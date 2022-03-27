import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {SelfReferencedObject} from "./_selfReferencedObject"

@Entity_()
export class SelfReferencedEntity {
  constructor(props?: Partial<SelfReferencedEntity>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Index_()
  @ManyToOne_(() => SelfReferencedEntity, {nullable: true})
  ref!: SelfReferencedEntity | undefined | null

  @Column_("jsonb", {transformer: {to: obj => obj == null ? undefined : obj.toJSON(), from: obj => obj == null ? undefined : new SelfReferencedObject(undefined, obj)}, nullable: true})
  obj!: SelfReferencedObject | undefined | null
}
