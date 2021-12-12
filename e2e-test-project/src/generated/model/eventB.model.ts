import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "../marshal"
import {Network} from "./network"
import {Status, fromJsonStatus} from "./status"

@Entity_()
export class EventB {
  constructor(props?: Partial<EventB>) {
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
  field2!: string

  @Column_("jsonb", {transformer: {to: obj => obj == null ? undefined : obj.map((val: any) => val.toJSON()), from: obj => obj == null ? undefined : marshal.fromList(obj, val => fromJsonStatus(val))}, nullable: true})
  statusList!: (Status)[] | undefined | null
}
