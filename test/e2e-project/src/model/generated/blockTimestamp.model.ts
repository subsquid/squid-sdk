import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "./marshal"

/**
 *  Tracks block timestamps 
 */
@Entity_()
export class BlockTimestamp {
    constructor(props?: Partial<BlockTimestamp>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("int4", {nullable: false})
    blockNumber!: number

    @Column_("numeric", {nullable: false, transformer: marshal.bigintTransformer})
    timestamp!: bigint
}
