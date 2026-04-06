import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {Swap} from "./swap.model"

@Entity_()
export class Account {
    constructor(props?: Partial<Account>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @OneToMany_(() => Swap, e => e.sender)
    swapsAsSender!: Swap[]

    @OneToMany_(() => Swap, e => e.to)
    swapsAsRecipient!: Swap[]
}
