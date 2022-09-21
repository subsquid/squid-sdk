import {assert} from "console"
import {Call, ChainContext, Event} from "./interfaces"
import {registry} from "./registry"
import {serialize, parse} from "@ethersproject/transactions"

export enum TransactionType {
    Legacy,
    EIP2930,
    EIP1559,
}

export interface Transaction {
    hash?: string;

    to?: string;
    from?: string;
    nonce: number;

    gasLimit: bigint;
    gasPrice?: bigint;

    data: string;
    value: bigint;
    chainId: number;

    r?: string;
    s?: string;
    v?: number;

    // Typed-Transaction features
    type?: TransactionType | null;

    // EIP-2930; Type 1 & EIP-1559; Type 2
    accessList?: {address: string, storageKeys: string[]}[];

    // EIP-1559; Type 2
    maxPriorityFeePerGas?: bigint;
    maxFeePerGas?: bigint;
}

export function getTransaction(ctx: ChainContext, call: Call): Transaction {
    assert(call.name === 'Ethereum.transact')

    let transaction: any
    switch (ctx._chain.getCallHash('Ethereum.transact')) {
        case registry.getHash('Ethereum.transactV0'):
        case registry.getHash('V14Ethereum.transactV0'):
            transaction = getAsV0(call.args)
            break
        case registry.getHash('Ethereum.transactV1'):
        case registry.getHash('V14Ethereum.transactV1'):
        case registry.getHash('Ethereum.transactV2'):
        case registry.getHash('V14Ethereum.transactV2'):
            transaction = getAsV1(call.args)
            break
        default:
            throw new Error()
    }

    let serializedTransaction = serialize(transaction.tx, transaction.signature)
    const {gasLimit, gasPrice, maxPriorityFeePerGas, maxFeePerGas, value, ...tx} = parse(serializedTransaction)
    return {
        ...tx,
        gasLimit: gasLimit.toBigInt(),
        gasPrice: gasPrice?.toBigInt(),
        maxFeePerGas: maxFeePerGas?.toBigInt(),
        maxPriorityFeePerGas: maxPriorityFeePerGas?.toBigInt(),
        value: value?.toBigInt()
    }
}

function getAsV0(args: any): any {
    const data = args.transaction
    return {
        tx: {
            to: data.action.value,
            nonce: Number(normalizeU256(data.nonce)),
            gasLimit: normalizeU256(data.gasLimit),
            gasPrice: normalizeU256(data.gasPrice),
            value: normalizeU256(data.value),
            data: data.input,
        },
        signature: {
            v: Number(data.signature.v),
            r: data.signature.r,
            s: data.signature.s,
        }
    }
}

function getAsV1(args: any): any {
    const transaction = args.transaction
    const data = transaction.value
    const to = data.action.value
    const nonce = Number(normalizeU256(data.nonce))
    const value = normalizeU256(data.value)
    const input = data.input
    const gasLimit = normalizeU256(data.gasLimit)
    switch (transaction.__kind) {
        case 'Legacy': {
            return {
                tx: {
                    to,
                    nonce,
                    value,
                    data: input,
                    gasLimit,
                    gasPrice: normalizeU256(data.gasPrice),
                    type: TransactionType.Legacy,
                },
                signature: {
                    v: Number(data.signature.v),
                    r: data.signature.r,
                    s: data.signature.s,
                }
            }
        }
        case 'EIP1559': {
            return {
                tx: {
                    to,
                    nonce,
                    value,
                    data: input,
                    gasLimit,
                    maxFeePerGas: normalizeU256(data.maxFeePerGas),
                    maxPriorityFeePerGas: normalizeU256(data.maxPriorityFeePerGas),
                    chainId: Number(data.chainId),
                    accessList: data.accessList,
                    type: TransactionType.EIP1559,
                },
                signature: {
                    r: data.r,
                    s: data.s,
                    v: Number(data.chainId),
                }
            }
        }
        case 'EIP2930': {
            const data = transaction.value
            return {
                tx: {
                    to,
                    nonce,
                    value,
                    data: input,
                    gasLimit,
                    gasPrice: normalizeU256(data.gasPrice),
                    chainId: Number(data.chainId),
                    accessList: data.accessList.map((a: any) => [
                        a.address,
                        a.storageKeys
                    ]),
                    type: TransactionType.EIP2930,
                },
                signature: {
                    r: data.r,
                    s: data.s,
                    v: Number(data.chainId),
                }
            }
        }
    }
}

function normalizeU256(value: bigint | bigint[]): bigint {
    if (Array.isArray(value)) {
        assert(value.length === 4)
        return toU256(toU128(value[0], value[1]), toU128(value[2], value[3]))
    } else {
        return BigInt(value)
    }
}

function toU128(a: bigint, b: bigint) {
    return BigInt(a) + (BigInt(b) << 64n)
}

function toU256(a: bigint, b: bigint) {
    return BigInt(a) + (BigInt(b) << 128n)
}