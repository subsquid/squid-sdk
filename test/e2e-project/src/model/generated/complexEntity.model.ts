import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"

@Entity_()
export class ComplexEntity {
    constructor(props?: Partial<ComplexEntity>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("text", {nullable: true})
    arg1!: string | undefined | null

    @Column_("text", {nullable: true})
    arg2!: string | undefined | null
}
