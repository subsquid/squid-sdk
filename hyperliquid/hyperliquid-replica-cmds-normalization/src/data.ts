import * as raw from '@subsquid/hyperliquid-replica-cmds-data'


export type Bytes = string


export interface Action {
    actionIndex: number
    signature: raw.Signature
    action: raw.Action
    nonce: number
    vaultAddress?: Bytes
    user?: Bytes
    status: raw.Status
    response: unknown
}


export interface BlockHeader {
    height: number
    hash: Bytes
    parentHash: Bytes
    round: number
    parentRound: number
    proposer: Bytes
    timestamp: number
    hardfork: raw.HardforkInfo
}


export interface Block {
    header: BlockHeader
    actions: Action[]
}
