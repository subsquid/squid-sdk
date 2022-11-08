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

export const rawMulticallAbi = [
    {
        inputs: [
            {
                components: [
                    {internalType: 'address', name: 'target', type: 'address'},
                    {internalType: 'bytes', name: 'callData', type: 'bytes'},
                ],
                internalType: 'struct Multicall2.Call[]',
                name: 'calls',
                type: 'tuple[]',
            },
        ],
        name: 'aggregate',
        outputs: [
            {internalType: 'uint256', name: 'blockNumber', type: 'uint256'},
            {internalType: 'bytes[]', name: 'returnData', type: 'bytes[]'},
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {internalType: 'bool', name: 'requireSuccess', type: 'bool'},
            {
                components: [
                    {internalType: 'address', name: 'target', type: 'address'},
                    {internalType: 'bytes', name: 'callData', type: 'bytes'},
                ],
                internalType: 'struct Multicall2.Call[]',
                name: 'calls',
                type: 'tuple[]',
            },
        ],
        name: 'tryAggregate',
        outputs: [
            {
                components: [
                    {internalType: 'bool', name: 'success', type: 'bool'},
                    {internalType: 'bytes', name: 'returnData', type: 'bytes'},
                ],
                internalType: 'struct Multicall2.Result[]',
                name: 'returnData',
                type: 'tuple[]',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
]
