import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import {HookType} from "./_hookType"
import {BlockTimestamp} from "./blockTimestamp.model"

/**
 *  Tracks block hooks 
 */
@Entity_()
export class BlockHook {
    constructor(props?: Partial<BlockHook>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("int4", {nullable: false})
    blockNumber!: number

    @Column_("varchar", {length: 4, nullable: false})
    type!: HookType

    @Index_()
    @ManyToOne_(() => BlockTimestamp, {nullable: true})
    timestamp!: BlockTimestamp | undefined | null
}
