import { BareHex32 } from '@subsquid/bitcoin-rpc'
import { BareHex } from '@subsquid/bitcoin-rpc/lib/validators'

export interface BlockHeader {
    number: number,
    hash: BareHex32,
    parentHash: BareHex32,
    timestamp: number,
    medianTime: number,
    version: number
    merkleRoot: BareHex32,
    nonce: number
    target: BareHex32
    bits: BareHex
    difficulty: number
    chainWork: BareHex32
    strippedSize: number
    size: number
    weight: number
}

export interface TransactionInputTx {
    txid: BareHex32,
    vout: number,
    scriptSig: {
        hex: BareHex,
        asm?: string
    },
    sequence: number,
    txInWitness?: BareHex[]
}

export interface TransactionInputCoinbase {
    coinbase: BareHex,
    sequence: number,
    txInWitness?: BareHex[]
}

export type TransactionInput = TransactionInputTx | TransactionInputCoinbase

export interface TransactionOutput {
    value: number,
    n: number,
    scriptPubKey: {
        hex: BareHex,
        asm?: string,
        desc?: string,
        type?: string,
        address?: string,
    }
}

export interface Transaction {
    hex: BareHex,
    txid: BareHex32,
    hash: BareHex32,
    size: number,
    vsize: number,
    weight: number,
    version: number,
    locktime: number,
    vin: TransactionInput[],
    vout: TransactionOutput[],
}

export interface Block {
    header: BlockHeader,
    transactions: Transaction[]
}
