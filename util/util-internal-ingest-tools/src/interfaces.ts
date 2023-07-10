
export type Hash = string


export interface HashAndHeight {
    hash: Hash
    height: number
}


export interface BlockHeader extends HashAndHeight {
    parentHash: string
}


export interface HotState extends HashAndHeight {
    top: HashAndHeight[]
}


export interface HotUpdate<B> {
    blocks: B[]
    baseHead: HashAndHeight
    finalizedHead: HashAndHeight
}


export interface Batch<B> {
    blocks: B[]
    isHead: boolean
}
