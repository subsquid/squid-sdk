import {
    array,
    GetSrcType,
    INT,
    ANY_INT,
    object,
    STRING,
    BOOLEAN,
    option,
    record,
    ANY,
    ANY_NAT
} from '@subsquid/util-internal-validation'


export const Log = object({
    address: STRING,
    data: option(STRING),
    topics: option(array(STRING))
})


export type Log = GetSrcType<typeof Log>


export const Contract = object({
    parameter: object({
        value: ANY,
        type_url: STRING
    }),
    type: STRING,
    Permission_id: option(INT)
})


export type Contract = GetSrcType<typeof Contract>


export const TransactionRawData = object({
    contract: array(Contract),
    ref_block_bytes: option(STRING),
    ref_block_hash: option(STRING),
    expiration: option(INT),
    fee_limit: option(ANY_INT),
    timestamp: option(ANY_INT)
})


export type TransactionRawData = GetSrcType<typeof TransactionRawData>


export const TransactionReceipt = object({
    result: option(STRING),
    energy_fee: option(ANY_NAT),
    energy_usage: option(ANY_NAT),
    energy_usage_total: option(ANY_NAT),
    net_usage: option(ANY_NAT),
    net_fee: option(ANY_NAT),
    origin_energy_usage: option(ANY_NAT),
    energy_penalty_total: option(ANY_NAT)
})


export type TransactionReceipt = GetSrcType<typeof TransactionReceipt>


export const CallValueInfo = object({
    callValue: option(ANY_NAT),
    tokenId: option(STRING),
})


export type CallValueInfo = GetSrcType<typeof CallValueInfo>


export const InternalTransaction = object({
    hash: STRING,
    caller_address: STRING,
    transferTo_address: option(STRING),
    callValueInfo: array(CallValueInfo),
    note: STRING,
    rejected: option(BOOLEAN),
    extra: option(STRING)
})


export type InternalTransaction = GetSrcType<typeof InternalTransaction>


export const TransactionInfo = object({
    id: STRING,
    fee: option(ANY_NAT),
    blockNumber: INT,
    blockTimeStamp: INT,
    contractResult: array(STRING),
    contract_address: option(STRING),
    receipt: TransactionReceipt,
    log: option(array(Log)),
    result: option(STRING),
    resMessage: option(STRING),
    withdraw_amount: option(ANY_NAT),
    unfreeze_amount: option(ANY_NAT),
    internal_transactions: option(array(InternalTransaction)),
    withdraw_expire_amount: option(ANY_NAT),
    cancel_unfreezeV2_amount: option(array(object({
        key: STRING,
        value: ANY_NAT
    }))),
})


export type TransactionInfo = GetSrcType<typeof TransactionInfo>


export const TransactionResult = object({
    contractRet: option(STRING)
})


export type TransactionResult = GetSrcType<typeof TransactionResult>


export const Transaction = object({
    ret: option(array(TransactionResult)),
    signature: option(array(STRING)),
    txID: STRING,
    raw_data: TransactionRawData,
    raw_data_hex: STRING
})


export type Transaction = GetSrcType<typeof Transaction>


export const BlockRawData = object({
    number: option(INT),
    txTrieRoot: STRING,
    witness_address: STRING,
    parentHash: STRING,
    version: option(INT),
    timestamp: option(INT)
})


export type BlockRawData = GetSrcType<typeof BlockRawData>


export const BlockHeader = object({
    raw_data: BlockRawData,
    witness_signature: option(STRING)
})


export type BlockHeader = GetSrcType<typeof BlockHeader>


export const Block = object({
    blockID: STRING,
    block_header: BlockHeader,
    transactions: option(array(Transaction))
})


export type Block = GetSrcType<typeof Block>


export interface BlockData {
    height: number
    hash: string
    block: Block
    transactionsInfo?: TransactionInfo[]
}
