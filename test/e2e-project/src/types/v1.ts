import type {Result} from './support'

export interface AccountInfo {
  nonce: number
  refcount: number
  data: AccountData
}

export interface AccountData {
  free: bigint
  reserved: bigint
  miscFrozen: bigint
  feeFrozen: bigint
}
