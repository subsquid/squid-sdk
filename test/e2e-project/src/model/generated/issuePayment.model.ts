import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToOne as OneToOne_, Index as Index_, JoinColumn as JoinColumn_} from "typeorm"
import {Issue} from "./issue.model"

@Entity_()
export class IssuePayment {
    constructor(props?: Partial<IssuePayment>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_({unique: true})
    @OneToOne_(() => Issue, {nullable: false})
    @JoinColumn_()
    issue!: Issue

    @Column_("int4", {nullable: false})
    amount!: number
}
