import type {Result} from './support'

export type TransactionV2 = TransactionV2_Legacy | TransactionV2_EIP2930 | TransactionV2_EIP1559

export interface TransactionV2_Legacy {
  __kind: 'Legacy'
  value: LegacyTransaction
}

export interface TransactionV2_EIP2930 {
  __kind: 'EIP2930'
  value: EIP2930Transaction
}

export interface TransactionV2_EIP1559 {
  __kind: 'EIP1559'
  value: EIP1559Transaction
}

export interface LegacyTransaction {
  nonce: bigint[]
  gasPrice: bigint[]
  gasLimit: bigint[]
  action: TransactionAction
  value: bigint[]
  input: Uint8Array
  signature: TransactionSignature
}

export interface EIP2930Transaction {
  chainId: bigint
  nonce: bigint[]
  gasPrice: bigint[]
  gasLimit: bigint[]
  action: TransactionAction
  value: bigint[]
  input: Uint8Array
  accessList: AccessListItem[]
  oddYParity: boolean
  r: Uint8Array
  s: Uint8Array
}

export interface EIP1559Transaction {
  chainId: bigint
  nonce: bigint[]
  maxPriorityFeePerGas: bigint[]
  maxFeePerGas: bigint[]
  gasLimit: bigint[]
  action: TransactionAction
  value: bigint[]
  input: Uint8Array
  accessList: AccessListItem[]
  oddYParity: boolean
  r: Uint8Array
  s: Uint8Array
}

export type TransactionAction = TransactionAction_Call | TransactionAction_Create

export interface TransactionAction_Call {
  __kind: 'Call'
  value: Uint8Array
}

export interface TransactionAction_Create {
  __kind: 'Create'
}

export interface TransactionSignature {
  v: bigint
  r: Uint8Array
  s: Uint8Array
}

export interface AccessListItem {
  address: Uint8Array
  storageKeys: Uint8Array[]
}
