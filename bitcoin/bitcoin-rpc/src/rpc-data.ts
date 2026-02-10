import {
    array,
    GetSrcType,
    NAT,
    object,
    oneOf,
    option,
    STRING,
} from '@subsquid/util-internal-validation'
import { BAREHEX, BAREHEX32, BTC_AMOUNT, FLOAT } from './validators'

export const TransactionInput = oneOf({
    tx: object({
        txid: BAREHEX32,
        vout: NAT,
        scriptSig: object({
            hex: BAREHEX,
            asm: option(STRING)
        }),
        sequence: NAT,
        txinwitness: option(array(BAREHEX))
    }),
    coinbase: object({
        coinbase: BAREHEX,
        sequence: NAT,
        txinwitness: option(array(BAREHEX))
    })
})

export type TransactionInput = GetSrcType<typeof TransactionInput>

export const TransactionOutput = object({
    value: BTC_AMOUNT,
    n: NAT,
    scriptPubKey: object({
        hex: BAREHEX,
        asm: option(STRING),
        desc: option(STRING),
        type: option(STRING),
        address: option(STRING),
    })
})

export type TransactionOutput = GetSrcType<typeof TransactionOutput>

export const Transaction = object({
    hex: BAREHEX,
    txid: BAREHEX32,
    hash: BAREHEX32,
    size: NAT,
    vsize: NAT,
    weight: NAT,
    version: NAT,
    locktime: NAT,
    vin: array(TransactionInput),
    vout: array(TransactionOutput),
})


export type Transaction = GetSrcType<typeof Transaction>

export const GetBlock = object({
    hash: BAREHEX32,
    confirmations: NAT,
    height: NAT,
    version: NAT,
    merkleroot: BAREHEX32,
    time: NAT,
    mediantime: NAT,
    nonce: NAT,
    target: BAREHEX32,
    bits: BAREHEX,
    difficulty: FLOAT,
    chainwork: BAREHEX32,
    previousblockhash: option(BAREHEX32),
    nextblockhash: option(BAREHEX32),
    strippedsize: NAT,
    size: NAT,
    weight: NAT,
    tx: oneOf({
        justHashes: array(BAREHEX32),
        fullTransactions: array(Transaction)
    }),
})


export type GetBlock = GetSrcType<typeof GetBlock>
