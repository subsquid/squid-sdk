
export type GenericMultiAddress = GenericMultiAddress_Id | GenericMultiAddress_Index | GenericMultiAddress_Raw | GenericMultiAddress_Address32 | GenericMultiAddress_Address20

export interface GenericMultiAddress_Id {
  __kind: 'Id'
  value: Uint8Array
}

export interface GenericMultiAddress_Index {
  __kind: 'Index'
  value: number
}

export interface GenericMultiAddress_Raw {
  __kind: 'Raw'
  value: Uint8Array
}

export interface GenericMultiAddress_Address32 {
  __kind: 'Address32'
  value: Uint8Array
}

export interface GenericMultiAddress_Address20 {
  __kind: 'Address20'
  value: Uint8Array
}
