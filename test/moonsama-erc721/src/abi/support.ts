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

export interface ContractCall<A extends any[], R> {
    call: (...args: A) => Promise<R>
    tryCall: (...args: A) => Promise<Result<R>>
}

export type Result<T> =
    | {
          success: true
          value: T
      }
    | {
          success: false
      }
