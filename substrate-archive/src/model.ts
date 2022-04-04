import type {QualifiedName, SpecVersion} from "@subsquid/substrate-metadata"
import type {sub} from "./interfaces"


export interface Block {
    id: string
    height: number
    hash: string
    parent_hash: string
    timestamp: Date
    spec_id: string
    validator?: string
}


export interface Event {
    id: string
    block_id: string
    index_in_block: number
    name: QualifiedName
    phase: sub.EventRecordPhase['__kind']
    extrinsic_id?: string
    call_id?: string
    args: any
    pos: number
}


export interface Extrinsic {
    id: string
    block_id: string
    index_in_block: number
    signature?: sub.ExtrinsicSignature
    success: boolean
    call_id: string
    hash: Uint8Array
    pos: number
}


export interface Call {
    id: string,
    parent_id?: string
    block_id: string
    extrinsic_id: string
    success: boolean
    name: string
    args: any
    pos: number
}


export interface Metadata {
    id: string
    spec_name: string
    spec_version: SpecVersion
    block_height: number
    block_hash: string
    hex: string
}


export interface Warning {
    block_id: string
    message: string
}


export interface BlockData {
    header: Block
    extrinsics: Extrinsic[]
    events: Event[]
    calls: Call[]
    metadata?: Metadata
    warnings?: Warning[]
    last?: boolean
}
