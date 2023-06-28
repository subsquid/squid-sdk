import {FieldSelection} from './data'
import {QualifiedName} from './data-base'


export interface DataRequest {
    fields?: FieldSelection
    includeAllBlocks?: boolean
    events?: EventRequest[]
    calls?: CallRequest[]
}


export interface EventRequest {
    name?: QualifiedName[]
    extrinsic?: boolean
    call?: boolean
    stack?: boolean
}


export interface CallRequest {
    name?: QualifiedName[]
    extrinsic?: boolean
    stack?: boolean
}
