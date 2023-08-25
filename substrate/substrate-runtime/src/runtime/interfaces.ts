/**
 * Hex encoded byte string
 */
export type Bytes = string


export type DecodedCall = {
    __kind: string
    value: {__kind: string} & any
}


export type DecodedEvent = {
    __kind: string
    value: {__kind: string} & any
}


export type QualifiedName = string


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
}


export interface Extrinsic {
    version: number
    call: DecodedCall
    signature?: ExtrinsicSignature
}


export interface ExtrinsicSignature {
    address: any
    signature: any
    signedExtensions: any
}
