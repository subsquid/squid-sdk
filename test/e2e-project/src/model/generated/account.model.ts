import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {Status, fromJsonStatus} from "./_status"
import {Transfer} from "./transfer.model"

@Entity_()
export class Account {
    constructor(props?: Partial<Account>) {
        Object.assign(this, props)
    }

    /**
     * Account address
     */
    @PrimaryColumn_()
    id!: string

    @Column_("numeric", {nullable: false, transformer: marshal.bigintTransformer})
    balance!: bigint

    @Column_("jsonb", {transformer: {to: obj => obj.toJSON(), from: obj => obj == null ? undefined : fromJsonStatus(obj)}, nullable: false})
    status!: Status

    @OneToMany_(() => Transfer, e => e.toAccount)
    incomingTx!: Transfer[]

    @OneToMany_(() => Transfer, e => e.fromAccount)
    outgoingTx!: Transfer[]
}
