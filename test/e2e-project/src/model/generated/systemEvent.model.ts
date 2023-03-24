import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "./marshal"
import {EventParam} from "./_eventParam"

@Entity_()
export class SystemEvent {
    constructor(props?: Partial<SystemEvent>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("jsonb", {transformer: {to: obj => obj.toJSON(), from: obj => obj == null ? undefined : new EventParam(undefined, obj)}, nullable: false})
    params!: EventParam

    @Column_("text", {array: true, nullable: true})
    arrayField!: (string)[] | undefined | null
}
