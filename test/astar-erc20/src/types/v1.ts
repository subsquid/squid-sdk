import type {Result} from './support'

export interface LegacyTransaction {
  nonce: bigint[]
  gasPrice: bigint[]
  gasLimit: bigint[]
  action: TransactionAction
  value: bigint[]
  input: Uint8Array
  signature: TransactionSignature
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
