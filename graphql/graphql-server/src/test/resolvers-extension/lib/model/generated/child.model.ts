import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, ManyToOne as ManyToOne_, Index as Index_} from "@subsquid/typeorm-store"
import {Parent} from "./parent.model"

@Entity_()
export class Child {
    constructor(props?: Partial<Child>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @StringColumn_({nullable: true})
    name!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Parent, {nullable: true})
    parent!: Parent | undefined | null
}
