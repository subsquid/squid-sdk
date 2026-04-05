import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, IntColumn as IntColumn_} from "@subsquid/typeorm-store"
import {DexType} from "./_dexType"

@Entity_()
export class TrackedPair {
    constructor(props?: Partial<TrackedPair>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("varchar", {length: 9, nullable: false})
    dexType!: DexType

    @StringColumn_({nullable: false})
    token0!: string

    @StringColumn_({nullable: false})
    token1!: string

    @IntColumn_({nullable: false})
    discoveredAtBlock!: number
}
