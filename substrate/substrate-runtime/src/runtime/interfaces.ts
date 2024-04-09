import type {BitSequence} from '@subsquid/scale-codec'
import type {ExternalEnum} from '@subsquid/scale-type-system'


export {BitSequence}


/**
 * Hex encoded byte string
 */
export type Bytes = string


export type DecodedCall = ExternalEnum


export type DecodedEvent = ExternalEnum


export type QualifiedName = string


export type JsonArgs = unknown


export type CallRecord<T = unknown> = {
    name: QualifiedName
    args: T
}


export type EventRecord<T = unknown>  = {
    name: QualifiedName
    args: T
}


export interface RuntimeVersionId {
    specName: string
    specVersion: number
    implName: string
    implVersion: number
}


export interface RpcClient {
    call(method: string, params?: any[]): Promise<any>
    batchCall(calls: {method: string, params?: any[]}[]): Promise<any[]>
}


export interface Extrinsic {
    version: number
    call: DecodedCall
    signature?: ExtrinsicSignature
}


export interface ExtrinsicSignature {
    address: unknown
    signature: unknown
    signedExtensions: unknown
}
