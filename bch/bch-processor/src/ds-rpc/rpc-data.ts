import {
    array,
    GetSrcType,
    NAT,
    object,
    option,
    STRING,
    ValidationFailure,
    Validator} from '@subsquid/util-internal-validation'
import {Bytes, Bytes32} from '../interfaces/base.js'

export class ValidationFailureEx extends ValidationFailure {
    toString(): string {
        let msg = this.message
        if (msg.includes('{value}')) {
            msg = msg.replace('{value}', JSON.stringify(this.value))
        }
        if (this.path.length) {
            msg = `invalid value at ${this.getPathString()}: ${msg}`
        }
        return msg
    }
}

/**
 * Hex encoded binary string or natural number without 0x prefix
 */
type Hex = string


function isHex(value: unknown): value is Hex {
    return typeof value == 'string' && /^[0-9a-fA-F]*$/.test(value)
}

/**
 * Hex encoded binary string without 0x prefix
 */
export const HEX: Validator<Hex> = {
    cast(value: unknown): Hex | ValidationFailureEx {
        return this.validate(value) || (value as Hex).toLowerCase()
    },
    validate(value: unknown): ValidationFailureEx | undefined {
        if (isHex(value)) return
        return new ValidationFailureEx(value, `{value} is not a hex encoded binary string`)
    },
    phantom(): Hex {
        return ''
    }
}

function isBigint(value: unknown): value is bigint {
    return typeof value == 'bigint';
}

/**
 * Hex encoded binary string without 0x prefix
 */
export const BIGINT: Validator<bigint> = {
    cast(value: unknown): bigint | ValidationFailureEx {
        return this.validate(value) || (value as bigint)
    },
    validate(value: unknown): ValidationFailureEx | undefined {
        if (isBigint(value)) return
        return new ValidationFailureEx(value, `{value} is not a bigint`)
    },
    phantom(): bigint {
        return 0n
    }
}

export interface RpcBlock {
    hash: string,
    confirmations: number,
    size: number,
    height: number,
    version: number,
    tx: string[],
    time: number,
    nonce: number,
    difficulty: number,
    nTx: number,
    previousblockhash: string,
}

export interface DataRequest {
    transactions?: boolean
    sourceOutputs?: boolean
    fee?: boolean
}


export interface Block {
    height: number
    hash: Bytes32
    block: GetBlock
    _isInvalid?: boolean
    _errorMessage?: string
}


const Transaction = object({
    blockNumber: NAT,
    blockHash: HEX,
    transactionIndex: NAT,
    size: NAT,
    hash: HEX,
    sourceOutputs: option(array(object({
        lockingBytecode: HEX,
        token: option(object({
            amount: BIGINT,
            category: HEX,
            nft: option(object({
                capability: STRING,
                commitment: HEX,
            })),
        })),
        valueSatoshis: BIGINT,
        address: STRING,
    }))),
    inputs: array(object({
        outpointIndex: NAT,
        outpointTransactionHash: HEX,
        sequenceNumber: NAT,
        unlockingBytecode: HEX,
    })),
    outputs: array(object({
        lockingBytecode: HEX,
        token: option(object({
            amount: BIGINT,
            category: HEX,
            nft: option(object({
                capability: STRING,
                commitment: HEX,
            })),
        })),
        valueSatoshis: BIGINT,
        address: STRING,
    })),
    locktime: NAT,
    version: NAT,
    fee: option(NAT),
})


export type Transaction = GetSrcType<typeof Transaction>


export const GetBlockWithTransactions = object({
    height: NAT,
    hash: HEX,
    parentHash: HEX,
    transactions: array(Transaction),
    difficulty: NAT,
    size: NAT,
    timestamp: NAT,
    nonce: NAT,
})


export const GetBlockNoTransactions = object({
    height: NAT,
    hash: HEX,
    parentHash: HEX,
    transactions: array(HEX),
    difficulty: NAT,
    size: NAT,
    timestamp: NAT,
    nonce: NAT,
})


export interface GetBlock {
    height: number
    hash: Bytes32
    parentHash: Bytes32
    transactions: Bytes[] | Transaction[]
    difficulty: number
    size: number
    timestamp: number
    nonce: number
}
