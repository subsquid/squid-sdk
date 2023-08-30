import {assertNotNull} from '@subsquid/util-internal'
import assert from 'assert'
import * as ethers from 'ethers'
import {Call} from './interfaces'
import {registry} from './registry'
import {normalizeAccessListItem, normalizeU256} from './util'

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

export function getTransaction(ethereumTransact: Call): Transaction {
    assert(ethereumTransact.name === 'Ethereum.transact')

    switch (ethereumTransact.block._runtime.calls.getTypeHash('Ethereum.transact')) {
        case registry.getTypeHash('Ethereum.transactV0'):
        case registry.getTypeHash('V14Ethereum.transactV0'):
            return getAsV0(ethereumTransact.args)
        case registry.getTypeHash('Ethereum.transactV1'):
        case registry.getTypeHash('Ethereum.transactV2'):
        case registry.getTypeHash('V14Ethereum.transactV1'):
        case registry.getTypeHash('V14Ethereum.transactV2'):
            return getAsV1(ethereumTransact.args)
        default:
            throw new Error('Unknown "Ethereum.transact" version')
    }
}

export function getAsV0(args: any): Transaction {
    return normalizeLegacyTransaction(args.transaction)
}

export function getAsV1(args: any): Transaction {
    const transaction = args.transaction
    switch (transaction.__kind) {
        case 'Legacy':
            return normalizeLegacyTransaction(transaction.value)
        case 'EIP2930':
            return normalizeEIP2930Transaction(transaction.value)
        case 'EIP1559':
            return normalizeEIP1559Transaction(transaction.value)
        default:
            throw new Error(`Unexpected transaction type: ${transaction.__kind}`)
    }
}

interface LegacyTransactionRaw {
    nonce: string | string[]
    gasPrice: string | string[]
    gasLimit: string | string[]
    action: {value?: string}
    value: string | string[]
    input: string
    signature: {
        v: string
        r: string
        s: string
    }
}

function normalizeLegacyTransaction(raw: LegacyTransactionRaw): LegacyTransaction {
    const tx = ethers.Transaction.from({
        to: raw.action.value,
        nonce: Number(normalizeU256(raw.nonce)),
        gasLimit: normalizeU256(raw.gasLimit),
        gasPrice: normalizeU256(raw.gasPrice),
        value: normalizeU256(raw.value),
        data: raw.input,
        type: TransactionType.Legacy,
        signature: raw.signature,
    })

    return {
        hash: assertNotNull(tx.hash),
        to: tx.to?.toLowerCase(),
        from: assertNotNull(tx.from).toLowerCase(),
        nonce: BigInt(tx.nonce),
        gasLimit: tx.gasLimit,
        input: tx.data,
        value: tx.value,
        r: assertNotNull(tx.signature?.r),
        s: assertNotNull(tx.signature?.s),
        v: BigInt(assertNotNull(tx.signature?.networkV)),
        type: TransactionType.Legacy,
        gasPrice: assertNotNull(tx.gasPrice),
    }
}

interface EIP1559TransactionRaw {
    chainId: string
    nonce: string | string[]
    maxPriorityFeePerGas: string | string[]
    maxFeePerGas: string | string[]
    gasLimit: string | string[]
    action: {value?: string}
    value: string | string[]
    input: string
    accessList: {address: string; storageKeys: string[]}[] | {address: string; slots: string[]}[]
    oddYParity: boolean
    r: string
    s: string
}

function normalizeEIP1559Transaction(raw: EIP1559TransactionRaw): EIP1559Transaction {
    const tx = ethers.Transaction.from({
        to: raw.action.value,
        chainId: Number(raw.chainId),
        nonce: Number(normalizeU256(raw.nonce)),
        gasLimit: normalizeU256(raw.gasLimit),
        maxFeePerGas: normalizeU256(raw.maxFeePerGas),
        maxPriorityFeePerGas: normalizeU256(raw.maxPriorityFeePerGas),
        value: normalizeU256(raw.value),
        accessList: raw.accessList.map((li) => normalizeAccessListItem(li)),
        data: raw.input,
        type: TransactionType.EIP1559,
        signature: {
            s: raw.s,
            r: raw.r,
            yParity: raw.oddYParity ? 1 : 0,
        },
    })

    return {
        hash: assertNotNull(tx.hash),
        to: tx.to?.toLowerCase(),
        from: assertNotNull(tx.from).toLowerCase(),
        nonce: BigInt(tx.nonce),
        gasLimit: tx.gasLimit,
        input: tx.data,
        value: tx.value,
        r: assertNotNull(tx.signature?.r),
        s: assertNotNull(tx.signature?.s),
        v: BigInt(assertNotNull(tx.signature?.yParity)),
        type: TransactionType.EIP1559,
        maxFeePerGas: assertNotNull(tx.maxFeePerGas),
        maxPriorityFeePerGas: assertNotNull(tx.maxPriorityFeePerGas),
        accessList: assertNotNull(tx.accessList),
        chainId: BigInt(tx.chainId),
    }
}

interface EIP2930TransactionRaw {
    chainId: string
    nonce: string | string[]
    gasPrice: string | string[]
    gasLimit: string | string[]
    action: {value?: string}
    value: string | string[]
    input: string
    accessList: {address: string; storageKeys: string[]}[] | {address: string; slots: string[]}[]
    oddYParity: boolean
    r: string
    s: string
}

function normalizeEIP2930Transaction(raw: EIP2930TransactionRaw): EIP2930Transaction {
    const tx = ethers.Transaction.from({
        to: raw.action.value,
        chainId: Number(raw.chainId),
        nonce: Number(normalizeU256(raw.nonce)),
        gasLimit: normalizeU256(raw.gasLimit),
        gasPrice: normalizeU256(raw.gasPrice),
        value: normalizeU256(raw.value),
        accessList: raw.accessList.map((li) => normalizeAccessListItem(li)),
        data: raw.input,
        type: TransactionType.EIP2930,
        signature: {
            s: raw.s,
            r: raw.r,
            yParity: raw.oddYParity ? 1 : 0,
        },
    })

    return {
        hash: assertNotNull(tx.hash),
        to: tx.to?.toLowerCase(),
        from: assertNotNull(tx.from).toLowerCase(),
        nonce: BigInt(tx.nonce),
        gasLimit: tx.gasLimit,
        input: tx.data,
        value: tx.value,
        r: assertNotNull(tx.signature?.r),
        s: assertNotNull(tx.signature?.s),
        v: BigInt(assertNotNull(tx.signature?.yParity)),
        type: TransactionType.EIP2930,
        gasPrice: assertNotNull(tx.gasPrice),
        accessList: assertNotNull(tx.accessList),
        chainId: BigInt(tx.chainId),
    }
}
