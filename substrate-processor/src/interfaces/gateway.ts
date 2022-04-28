import type {QualifiedName, SubstrateBlock, SubstrateEvent, SubstrateExtrinsicSignature} from "./substrate"


export interface BatchRequest {
    limit: number
    fromBlock: number
    toBlock: number
    includeAllBlocks?: boolean
    events?: ObjectRequest[]
    calls?: ObjectRequest[]
    evmLogs?: EvmLogRequest[]
}


export interface ObjectRequest {
    name: string
    data?: any
}


export interface EvmLogRequest {
    contract: string
    filter?: string[][]
    data?: any
}


export interface BatchBlock {
    header: Omit<SubstrateBlock, 'timestamp'> & {timestamp: string}
    events: Event[]
    calls: Call[]
    extrinsics: Extrinsic[]
}


export interface Event {
    id: string
    index_in_block?: number
    name?: QualifiedName
    args?: any
    phase?: SubstrateEvent["phase"]
    extrinsic_id?: string
    call_id?: string
    pos: number
}


export interface Call {
    id: string
    name?: QualifiedName
    args?: any
    success?: boolean
    extrinsic_id?: string
    parent_id?: string
    pos: number
}


export interface Extrinsic {
    id: string
    index_in_block?: number
    call_id?: string
    signature?: SubstrateExtrinsicSignature
    success?: boolean
    hash?: string
    pos: number
}
