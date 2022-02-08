import {ChainDescription, SpecVersion} from "@subsquid/substrate-metadata"


export interface RuntimeVersion {
    specVersion: SpecVersion
}


type RawExtrinsic = string
export type RawMetadata = string
type Spec = number
export type QualifiedName = string

interface BlockHeader {
    parentHash: string
}

interface Block {
    header: BlockHeader
    extrinsics: RawExtrinsic[]
}

export interface SignedBlock {
    block: Block
}

export interface BlockEntity {  // TODO: rename/remove entity postfix
    id: string
    height: number
    hash: string
    parent_hash: string
    timestamp: Date
}

export interface EventEntity {
    id: string
    block_id: string
    name: QualifiedName
    args: unknown
}

export interface ExtrinsicEntity {
    id: string
    block_id: string
    name: QualifiedName
    tip: BigInt
    nonce: number
    hash: string
}

export interface CallEntity {
    extrinsic_id: string
    args: unknown
}

interface MetadataEntity {
    spec_version: Spec
    block_height: number
    block_hash: number
    data: string
}

export interface SpecInfo {
    specVersion: SpecVersion
    description: ChainDescription
    rawMetadata: string
}


export interface LastBlock extends BlockEntity {
    specVersion: SpecVersion
}

export interface ExtrinsicCall {
    __kind: string,
    value: {__kind: string, [key: string]: any}
}

export interface Event {
    __kind: string
    value: {__kind: string, value: any}
}
