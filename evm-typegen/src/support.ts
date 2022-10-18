export interface EvmLog {
    data: string
    topics: string[]
}

export interface EvmTransaction {
    input: string
}

export interface Chain {
    client: {
        call: <T = any>(method: string, params?: unknown[]) => Promise<T>
    }
}

export interface ChainContext {
    _chain: Chain
}

export interface BlockContext {
    _chain: Chain
    block: Block
}

export interface Block {
    height: number
}

export type Result<T> =
    | {
          success: true
          value: T
      }
    | {
          success: false
      }
