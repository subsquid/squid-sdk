import {ListArguments} from "./args"


export type FieldRequest = EntityListRequest | ObjectRequest | OpaqueRequest


interface BaseFieldRequest {
    field: string
    aliases: string[]
    ifType?: string
    index: number
}


export interface EntityListRequest extends BaseFieldRequest {
    kind: 'entity-list'
    children: FieldRequest[]
    args?: ListArguments
}


export interface ObjectRequest extends BaseFieldRequest {
    kind: 'object'
    children: FieldRequest[]
}


export interface OpaqueRequest extends BaseFieldRequest {
    kind: 'opaque'
}
