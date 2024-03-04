export interface AbiParameter {
  name?: string
  type: string,
  components?: readonly AbiParameter[]
  internalType?: string
}

export type Hex = `0x${string}`
