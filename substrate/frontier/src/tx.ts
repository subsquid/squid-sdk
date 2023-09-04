import {Bytes} from '@subsquid/substrate-runtime'
import {assertNotNull} from '@subsquid/util-internal'
import assert from 'assert'
import * as ethers from 'ethers'
import {
    EthereumTransactLatest,
    EthereumTransactLegacy,
    IAction,
    IEIP1559Transaction,
    IEIP2930Transaction,
    ILegacyTransaction
} from './tx-types'
import {Call} from './types'
import {normalizeAccessList, normalizeU256} from './util'


export enum TransactionType {
    Legacy,
    EIP2930,
    EIP1559,
}


interface BaseTransaction {
    hash: Bytes
    to?: Bytes
    from: Bytes
    nonce: bigint
    gasLimit: bigint
    input: Bytes
    value: bigint
    r: Bytes
    s: Bytes
    v: bigint
    type: TransactionType
}


export interface AccessListItem {
    address: Bytes
    storageKeys: Bytes[]
}


export interface LegacyTransaction extends BaseTransaction {
    type: TransactionType.Legacy
    gasPrice: bigint
}


export interface EIP2930Transaction extends BaseTransaction {
    type: TransactionType.EIP2930
    gasPrice: bigint
    accessList: AccessListItem[]
    chainId: bigint
}


export interface EIP1559Transaction extends BaseTransaction {
    type: TransactionType.EIP1559
    accessList: AccessListItem[]
    maxPriorityFeePerGas: bigint
    maxFeePerGas: bigint
    chainId: bigint
}


export type Transaction = LegacyTransaction | EIP2930Transaction | EIP1559Transaction


export function getTransaction(ethereumTransact: Call): Transaction {
    assert(ethereumTransact.name === 'Ethereum.transact')
    if (EthereumTransactLegacy.is(ethereumTransact)) {
        let args = EthereumTransactLegacy.decode(ethereumTransact)
        return normalizeLegacyTransaction(args.transaction)
    } else if (EthereumTransactLatest.is(ethereumTransact)) {
        let args = EthereumTransactLatest.decode(ethereumTransact)
        switch(args.transaction.__kind) {
            case 'Legacy':
                return normalizeLegacyTransaction(args.transaction.value)
            case 'EIP1559':
                return normalizeEIP1559Transaction(args.transaction.value)
            case 'EIP2930':
                return normalizeEIP2930Transaction(args.transaction.value)
        }
    } else {
        throw new Error('Ethereum.transact call has unexpected type')
    }
}


function normalizeLegacyTransaction(raw: ILegacyTransaction): LegacyTransaction {
    const tx = ethers.Transaction.from({
        to: getTo(raw.action),
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
        gasPrice: assertNotNull(tx.gasPrice),
        type: TransactionType.Legacy
    }
}


function normalizeEIP1559Transaction(raw: IEIP1559Transaction): EIP1559Transaction {
    const tx = ethers.Transaction.from({
        to: getTo(raw.action),
        chainId: Number(raw.chainId),
        nonce: Number(normalizeU256(raw.nonce)),
        gasLimit: normalizeU256(raw.gasLimit),
        maxFeePerGas: normalizeU256(raw.maxFeePerGas),
        maxPriorityFeePerGas: normalizeU256(raw.maxPriorityFeePerGas),
        value: normalizeU256(raw.value),
        accessList: normalizeAccessList(raw.accessList),
        data: raw.input,
        signature: {
            s: raw.s,
            r: raw.r,
            yParity: raw.oddYParity ? 1 : 0,
        },
        type: TransactionType.EIP1559
    })

    return {
        type: TransactionType.EIP1559,
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
        maxFeePerGas: assertNotNull(tx.maxFeePerGas),
        maxPriorityFeePerGas: assertNotNull(tx.maxPriorityFeePerGas),
        accessList: assertNotNull(tx.accessList),
        chainId: BigInt(tx.chainId)
    }
}


function normalizeEIP2930Transaction(raw: IEIP2930Transaction): EIP2930Transaction {
    const tx = ethers.Transaction.from({
        type: TransactionType.EIP2930,
        to: getTo(raw.action),
        chainId: Number(raw.chainId),
        nonce: Number(normalizeU256(raw.nonce)),
        gasLimit: normalizeU256(raw.gasLimit),
        gasPrice: normalizeU256(raw.gasPrice),
        value: normalizeU256(raw.value),
        accessList: normalizeAccessList(raw.accessList),
        data: raw.input,
        signature: {
            s: raw.s,
            r: raw.r,
            yParity: raw.oddYParity ? 1 : 0,
        }
    })

    return {
        type: TransactionType.EIP2930,
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
        gasPrice: assertNotNull(tx.gasPrice),
        accessList: assertNotNull(tx.accessList),
        chainId: BigInt(tx.chainId),
    }
}


function getTo(action: IAction): Bytes | undefined {
    if (action.__kind == 'Call') return action.value
}
