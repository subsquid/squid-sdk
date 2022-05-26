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
    version: number
    signature?: sub.ExtrinsicSignature
    call_id: string
    fee?: bigint
    tip?: bigint | number
    success: boolean
    error?: unknown
    pos: number
    hash: Uint8Array
}


export interface Call {
    id: string,
    parent_id?: string
    block_id: string
    extrinsic_id: string
    origin?: unknown
    name: string
    args: any
    success: boolean
    error?: unknown
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
