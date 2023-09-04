import {
    array,
    bigint,
    boolean,
    bytes,
    closedEnum,
    GetType,
    struct,
    tuple,
    union,
    unit
} from '@subsquid/substrate-runtime/lib/sts'
import {CallType} from './types'


const U256 = union(
    bigint(),
    tuple(bigint(), bigint(), bigint(), bigint())
)


export type IU256 = GetType<typeof U256>


const Action = closedEnum({
    Create: unit(),
    Call: bytes()
})


export type IAction = GetType<typeof Action>


const AccessList = array(
    struct({
        address: bytes(),
        storageKeys: array(bytes)
    })
)


export const LegacyTransaction = struct({
    action: Action,
    nonce: U256,
    gasPrice: U256,
    gasLimit: U256,
    value: U256,
    input: bytes(),
    signature: struct({
        v: bigint(),
        r: bytes(),
        s: bytes()
    })
})


export type ILegacyTransaction = GetType<typeof LegacyTransaction>


export const EIP1559Transaction = struct({
    chainId: bigint(),
    action: Action,
    nonce: U256,
    maxPriorityFeePerGas: U256,
    maxFeePerGas: U256,
    gasLimit: U256,
    value: U256,
    input: bytes(),
    accessList: AccessList,
    oddYParity: boolean(),
    r: bytes(),
    s: bytes()
})


export type IEIP1559Transaction = GetType<typeof EIP1559Transaction>


export const EIP2930Transaction = struct({
    chainId: bigint(),
    action: Action,
    nonce: U256,
    gasPrice: U256,
    gasLimit: U256,
    value: U256,
    input: bytes(),
    accessList: AccessList,
    oddYParity: boolean(),
    r: bytes(),
    s: bytes()
})


export type IEIP2930Transaction = GetType<typeof EIP2930Transaction>


export const EthereumTransactLegacy = new CallType(
    struct({
        transaction: LegacyTransaction
    })
)


export const EthereumTransactLatest = new CallType(
    struct({
        transaction: closedEnum({
            Legacy: LegacyTransaction,
            EIP1559: EIP1559Transaction,
            EIP2930: EIP2930Transaction
        })
    })
)
