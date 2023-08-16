export type DecodedCall = {
    __kind: string
    value: {__kind: string} & any
}


export type DecodedEvent = {
    __kind: string
    value: {__kind: string} & any
}


export type QualifiedName = string


export type JsonCall = {
    name: QualifiedName
    args: any
}


export type JsonEvent = {
    name: QualifiedName
    args: any
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
