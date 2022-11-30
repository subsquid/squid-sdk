import assert from 'assert'
import {Call, ChainContext} from './interfaces'
import {registry} from './registry'
import {serialize, parse} from '@ethersproject/transactions'
import {clearUndefinedFields, normalizeU256} from './util'

export enum TransactionType {
    Legacy,
    EIP2930,
    EIP1559,
}

interface BaseTransaction {
    hash: string
    to?: string
    from: string
    nonce: bigint
    gasLimit: bigint
    input: string
    value: bigint
    r: string
    s: string
    v: bigint
    type: TransactionType
}

export interface LegacyTransaction extends BaseTransaction {
    type: TransactionType.Legacy
    gasPrice: bigint
}

export interface EIP2930Transaction extends BaseTransaction {
    type: TransactionType.EIP2930
    gasPrice: bigint
    accessList: {address: string; storageKeys: string[]}[]
    chainId: bigint
}

export interface EIP1559Transaction extends BaseTransaction {
    type: TransactionType.EIP1559
    accessList: {address: string; storageKeys: string[]}[]
    maxPriorityFeePerGas?: bigint
    maxFeePerGas?: bigint
    chainId: bigint
}

export type Transaction = LegacyTransaction | EIP2930Transaction | EIP1559Transaction

export function getTransaction(ctx: ChainContext, call: Call): Transaction {
    assert(call.name === 'Ethereum.transact')

    switch (ctx._chain.getCallHash('Ethereum.transact')) {
        case registry.getHash('Ethereum.transactV0'):
        case registry.getHash('V14Ethereum.transactV0'):
            return getAsV0(call.args)
        case registry.getHash('Ethereum.transactV1'):
        case registry.getHash('Ethereum.transactV2'):
        case registry.getHash('V14Ethereum.transactV1'):
        case registry.getHash('V14Ethereum.transactV2'):
            return getAsV1(call.args)
        default:
            throw new Error('Uknown "Ethereum.transact" version')
    }
}

export function getAsV0(args: any): Transaction {
    const data = args.transaction
    return normalizeTransaction({
        to: data.action.value || undefined,
        nonce: normalizeU256(data.nonce),
        gasLimit: normalizeU256(data.gasLimit),
        gasPrice: normalizeU256(data.gasPrice),
        value: normalizeU256(data.value),
        input: data.input,
        type: TransactionType.Legacy,
        v: BigInt(data.signature.v),
        r: data.signature.r,
        s: data.signature.s,
    })
}

export function getAsV1(args: any): Transaction {
    const transaction = args.transaction
    const data = transaction.value
    const signature = data.signature || {
        v: data.v,
        r: data.r,
        s: data.s,
    }
    return normalizeTransaction({
        type: transaction.__kind === 'Legacy' ? 0 : transaction.__kind === 'EIP2930' ? 1 : 2,
        to: data.action.value || undefined,
        nonce: normalizeU256(data.nonce),
        gasLimit: normalizeU256(data.gasLimit),
        gasPrice: data.gasPrice ? normalizeU256(data.gasPrice) : undefined,
        value: normalizeU256(data.value),
        maxFeePerGas: data.maxFeePerGas ? normalizeU256(data.maxFeePerGas) : undefined,
        maxPriorityFeePerGas: data.maxPriorityFeePerGas ? normalizeU256(data.maxPriorityFeePerGas) : undefined,
        chainId: data.chainId ? BigInt(data.chainId) : undefined,
        accessList: data.accessList,
        input: data.input,
        v: BigInt(signature.v || 0n),
        r: signature.r,
        s: signature.s,
    })
}

interface TransactionData {
    to?: string
    nonce: bigint
    gasLimit: bigint
    input: string
    value: bigint
    r: string
    s: string
    v: bigint
    type: TransactionType
    gasPrice?: bigint
    accessList?: {address: string; storageKeys: string[]}[]
    maxPriorityFeePerGas?: bigint
    maxFeePerGas?: bigint
    chainId?: bigint
}

function normalizeTransaction(tx: TransactionData): Transaction {
    const serializedTransaction = serialize(
        clearUndefinedFields({
            to: tx.to,
            nonce: Number(tx.nonce),
            gasLimit: tx.gasLimit,
            data: tx.input,
            value: tx.value,
            type: tx.type,
            gasPrice: tx.gasPrice,
            accessList: tx.accessList,
            maxFeePerGas: tx.maxFeePerGas,
            maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
            chainId: tx.chainId ? Number(tx.chainId) : undefined,
        }),
        {
            v: Number(tx.v),
            s: tx.s,
            r: tx.r,
        }
    )
    const {from, hash} = parse(serializedTransaction)
    assert(from != null)
    assert(hash != null)

    return {
        ...tx,
        from: from.toLowerCase(),
        hash,
    } as any
}
