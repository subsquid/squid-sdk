import type {BlockData, Bytes} from '@subsquid/substrate-data-raw'
import type {Runtime} from '@subsquid/substrate-runtime'
import type {AccountId} from '../parsing/validator'
import type {Block as ParsedBlock} from './data'


/**
 * Decoded value of Session.CurrentIndex storage
 */
export type SessionIndex = number | bigint


export interface RawBlock extends BlockData {
    validators?: AccountId[]
    session?: SessionIndex
    runtime?: Runtime
    runtimeOfPrevBlock?: Runtime
    /**
     * Decoded value of TransactionPayment.NextFeeMultiplier storage
     */
    feeMultiplier?: number | bigint
    /**
     * Storage values of previous block
     */
    storage?: {
        [key: Bytes]: Bytes | null
    }
    parsed?: ParsedBlock
}
