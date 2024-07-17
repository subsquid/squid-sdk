import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class Parent {
    constructor(props?: Partial<Parent>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @StringColumn_({nullable: true})
    name!: string | undefined | null
}
