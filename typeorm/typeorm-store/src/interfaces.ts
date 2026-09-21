import type {TemplateMutation} from './templates'


export interface HashAndHeight {
    height: number
    hash: string
}


export interface DatabaseState {
    height: number
    hash: string
    top: HotBlock[]
    nonce: number
    templates: TemplateMutation[]
}


export interface FinalTxInfo {
    prevHead: HashAndHeight
    nextHead: HashAndHeight
}


export interface HotTxInfo {
    finalizedHead: HashAndHeight
    baseHead: HashAndHeight
    newBlocks: HashAndHeight[]
}


export interface HotBlock extends HashAndHeight {
    templates: TemplateMutation[]
}