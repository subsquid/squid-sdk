import {GetBlock} from './schema'


export * from './schema'


/**
 * Base58 encoded bytes
 */
export type Base58Bytes = string


export interface Block {
    /**
     * `block.blockhash`
     */
    hash: Base58Bytes
    /**
     * `block.blockHeight`
     */
    height: number
    slot: number
    block: GetBlock
}
