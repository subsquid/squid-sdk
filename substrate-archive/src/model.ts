import type {QualifiedName, SpecVersion} from "@subsquid/substrate-metadata"
import {sub} from "./interfaces"


export interface Block {
    id: string
    height: number
    hash: string
    parent_hash: string
    timestamp: Date
}


export interface Event {
    id: string
    block_id: string
    phase: sub.EventRecordPhase['__kind']
    index_in_block: number
    name: QualifiedName
    extrinsic_id?: string
    call_id?: string
    args: unknown
}


export interface Extrinsic {
    id: string
    block_id: string
    name: QualifiedName
    index_in_block: number
    signature?: sub.ExtrinsicSignature
    success: boolean
    hash: Uint8Array
}


export interface Call {
    id: string,
    index: number
    extrinsic_id: string
    parent_id: string | null
    success: boolean
    args: unknown
}


export interface Metadata {
    spec_version: SpecVersion
    block_height: number
    block_hash: number
    data: string
}
