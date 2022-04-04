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
    data?: any
}


export interface BatchBlock {
    header: SubstrateBlock
    events: Event[]
    calls: Call[]
    extrinsics: Extrinsic[]
}


export interface Event {
    id: string
    indexInBlock?: number
    name?: QualifiedName
    args?: any
    phase?: SubstrateEvent["phase"]
    extrinsicId?: string
    callId?: string
    pos: number
}


export interface Call {
    id: string
    name?: QualifiedName
    args?: any
    success?: boolean
    extrinsicId?: string
    parentId?: string
    pos: number
}


export interface Extrinsic {
    id: string
    indexInBlock?: number
    callId?: string
    signature?: SubstrateExtrinsicSignature
    success?: boolean
    hash?: string
    pos: number
}
