import assert from 'assert'
import {Block, Chain, ChainContext, BlockContext, Result} from './support'
import * as v1 from './v1'

export class SystemAccountStorage {
  private readonly _chain: Chain
  private readonly blockHash: string

  constructor(ctx: BlockContext)
  constructor(ctx: ChainContext, block: Block)
  constructor(ctx: BlockContext, block?: Block) {
    block = block || ctx.block
    this.blockHash = block.hash
    this._chain = ctx._chain
  }

  /**
   *  The full account information for a particular account ID.
   */
  get isV1() {
    return this._chain.getStorageItemTypeHash('System', 'Account') === 'eb40f1d91f26d72e29c60e034d53a72b9b529014c7e108f422d8ad5f03f0c902'
  }

  /**
   *  The full account information for a particular account ID.
   */
  get asV1(): {
      get(key: Uint8Array): Promise<v1.AccountInfo>
      getMany(keys: Uint8Array[]): Promise<(v1.AccountInfo)[]>
      getAll(): Promise<v1.AccountInfo[]>
    } {
      assert(this.isV1)
      return this as any
  }

  private async get(...keys: any[]): Promise<any> {
    return this._chain.getStorage(this.blockHash, 'System', 'Account', ...keys)
  }

  private async getMany(keyList: any[]): Promise<any[]> {
    let query = Array.isArray(keyList[0]) ? keyList : keyList.map(k => [k])
    return this._chain.queryStorage(this.blockHash, 'System', 'Account', query)
  }

  private async getAll(): Promise<any[]> {
    return this._chain.queryStorage(this.blockHash, 'System', 'Account')
  }

  /**
   * Checks whether the storage item is defined for the current chain version.
   */
  get isExists(): boolean {
    return this._chain.getStorageItemTypeHash('System', 'Account') != null
  }
}
