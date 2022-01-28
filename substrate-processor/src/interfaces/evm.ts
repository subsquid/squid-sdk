import {SubstrateBlock, SubstrateEvent, SubstrateExtrinsic} from "./substrate";
import {Store} from "./handlerContext";
import {Range} from "../util/range";
import {Chain} from "../chain";

export interface EvmLogHandlerContext {
    topics?: string[]
    data?: string
    txHash?: string
    contractAddress?: string
    substrate: {_chain: Chain, event: SubstrateEvent, block: SubstrateBlock, extrinsic?: SubstrateExtrinsic}
    store: Store
}

export interface EvmLogHandler {
    (ctx: EvmLogHandlerContext): Promise<void>
}

export interface EvmLogHook {
    handler: EvmLogHandler
    contractAddress: ContractAddress
    topics?: string[]
    range?: Range
}

export interface EvmLogHandlerOptions {
    range?: Range
    topics?: string[]
}

export type ContractAddress = string

