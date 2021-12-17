import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import {Network} from "./_network"

@Entity_()
export class EventA {
  constructor(props?: Partial<EventA>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: true})
  inExtrinsic!: string | undefined | null

  @Column_("integer", {nullable: false})
  inBlock!: number

  @Column_("varchar", {length: 10, nullable: false})
  network!: Network

  @Column_("integer", {nullable: false})
  indexInBlock!: number

  @Column_("text", {nullable: false})
  field1!: string
}
