import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_, Relation as Relation_} from "@subsquid/typeorm-store"
import {Transfer} from "./transfer.model"

@Entity_()
export class Account {
    constructor(props?: Partial<Account>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @OneToMany_(() => Transfer, e => e.from)
    transfersFrom!: Relation_<Transfer[]>

    @OneToMany_(() => Transfer, e => e.to)
    transfersTo!: Relation_<Transfer[]>
}
