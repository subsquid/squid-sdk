import type {QueryBase} from '../common/query'
import type {Selector} from '../type-util'

/**
 * Hex strings on TRON come without the `0x` prefix: addresses are 21 bytes starting with `41`,
 * hashes and log topics are bare hex.
 */
export type Hex = string

export interface FieldSelection {
    block?: Selector<
        | 'number'
        | 'hash'
        | 'parentHash'
        | 'txTrieRoot'
        | 'version'
        | 'timestamp'
        | 'witnessAddress'
        | 'witnessSignature'
    >
    transaction?: Selector<
        | 'transactionIndex'
        | 'hash'
        | 'ret'
        | 'signature'
        | 'type'
        | 'parameter'
        | 'permissionId'
        | 'refBlockBytes'
        | 'refBlockHash'
        | 'feeLimit'
        | 'expiration'
        | 'timestamp'
        | 'rawDataHex'
        | 'fee'
        | 'contractResult'
        | 'contractAddress'
        | 'resMessage'
        | 'withdrawAmount'
        | 'unfreezeAmount'
        | 'withdrawExpireAmount'
        | 'cancelUnfreezeV2Amount'
        | 'result'
        | 'energyFee'
        | 'energyUsage'
        | 'energyUsageTotal'
        | 'netUsage'
        | 'netFee'
        | 'originEnergyUsage'
        | 'energyPenaltyTotal'
    >
    log?: Selector<'transactionIndex' | 'logIndex' | 'address' | 'data' | 'topics'>
    internalTransaction?: Selector<
        | 'transactionIndex'
        | 'internalTransactionIndex'
        | 'hash'
        | 'callerAddress'
        | 'transferToAddress'
        | 'callValueInfo'
        | 'note'
        | 'rejected'
        | 'extra'
    >
}

export interface TransactionRequest {
    type?: string[]
    logs?: boolean
    internalTransactions?: boolean
}

export interface TransferTransactionRequest {
    owner?: Hex[]
    to?: Hex[]
    logs?: boolean
    internalTransactions?: boolean
}

export interface TransferAssetTransactionRequest {
    owner?: Hex[]
    to?: Hex[]
    asset?: string[]
    logs?: boolean
    internalTransactions?: boolean
}

export interface TriggerSmartContractTransactionRequest {
    owner?: Hex[]
    contract?: Hex[]
    sighash?: Hex[]
    logs?: boolean
    internalTransactions?: boolean
}

export interface LogRequest {
    address?: Hex[]
    topic0?: Hex[]
    topic1?: Hex[]
    topic2?: Hex[]
    topic3?: Hex[]
    transaction?: boolean
}

export interface InternalTransactionRequest {
    caller?: Hex[]
    transferTo?: Hex[]
    transaction?: boolean
}

export interface ItemQuery {
    transactions?: TransactionRequest[]
    transferTransactions?: TransferTransactionRequest[]
    transferAssetTransactions?: TransferAssetTransactionRequest[]
    triggerSmartContractTransactions?: TriggerSmartContractTransactionRequest[]
    logs?: LogRequest[]
    internalTransactions?: InternalTransactionRequest[]
}

export interface Query<F extends FieldSelection = FieldSelection> extends QueryBase, ItemQuery {
    type: 'tron'
    fields?: F
}

/**
 * A TRON block as the portal returns it.
 *
 * Only the block number and hash are validated: values keep their wire format
 * (e.g. int64 amounts as decimal strings), and decoding is left to the consumer.
 */
export interface Block<F extends FieldSelection = FieldSelection> {
    header: {number: number; hash: Hex} & Record<string, unknown>
    transactions?: Record<string, unknown>[]
    logs?: Record<string, unknown>[]
    internalTransactions?: Record<string, unknown>[]
    /** @internal */
    __fields?: F
}
