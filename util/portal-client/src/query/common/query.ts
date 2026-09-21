export interface QueryBase {
    fromBlock: number
    toBlock?: number
    parentBlockHash?: string
    includeAllBlocks?: boolean
}
