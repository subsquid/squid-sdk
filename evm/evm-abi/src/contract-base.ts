import type { AbiFunction } from './abi-components/function'
import type { Codec, Struct, EncodedStruct } from '@subsquid/evm-codec'

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

export class ContractBase {
  private readonly _chain: Chain
  private readonly blockHeight: number
  readonly address: string

  constructor(ctx: BlockContext, address: string)
  constructor(ctx: ChainContext, block: Block, address: string)
  constructor(ctx: BlockContext, blockOrAddress: Block | string, address?: string) {
    this._chain = ctx._chain
    if (typeof blockOrAddress === 'string') {
      this.blockHeight = ctx.block.height
      this.address = blockOrAddress
    } else {
      if (address == null) {
        throw new Error('missing contract address')
      }
      this.blockHeight = blockOrAddress.height
      this.address = address
    }
  }

  /**
   * Call a contract function using eth_call with the given calldata.
   * Might be necessary to override for some chains.
   */
  private async rpc_call(calldata: string) {
    return this._chain.client.call('eth_call', [
      { to: this.address, data: calldata },
      '0x' + this.blockHeight.toString(16),
    ])
  }

  async eth_call<const T extends Struct, const R extends Codec<any> | Struct | undefined>(
    func: AbiFunction<T, R>,
    args: EncodedStruct<T>,
  ) {
    const data = func.encode(args)
    const result = await this.rpc_call(data)
    return func.decodeResult(result)
  }
}
