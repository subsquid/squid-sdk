import type {QualifiedName, SubstrateBlock, SubstrateEvent, SubstrateExtrinsicSignature} from "./substrate"


export interface BatchRequest {
    limit: number
    fromBlock: number
    toBlock: number
    includeAllBlocks?: boolean
    events?: ObjectRequest[]
    calls?: ObjectRequest[]
}


export interface ObjectRequest {
    name: string
    fields?: any
}


export interface BlockData {
    header: SubstrateBlock
    events: Event[]
    calls: Call[]
    extrinsics: Extrinsic[]
}


export interface Event {
    id: string
    index_in_block: number
    name: QualifiedName
    args: any
    phase: SubstrateEvent["phase"]
    extrinsic_id?: string
    call_id?: string
}


export interface Call {
    id: string
    index: number
    name: QualifiedName
    args: any
    success: boolean
    extrinsic_id?: string
    parent_id?: string
}


export interface Extrinsic {
    id: string
    index_in_block: number
    call_id: string
    signature?: SubstrateExtrinsicSignature
    success: boolean
    hash: string
}
