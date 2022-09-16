import assert from 'assert'
import {Block, Chain, ChainContext, BlockContext, Result} from './support'
import * as v1 from './v1'

interface SystemAccountStorageV1 {
  get(key: Uint8Array): Promise<v1.AccountInfo>
  getMany(keys: Uint8Array[]): Promise<(v1.AccountInfo)[]>
  getAll(): Promise<v1.AccountInfo[]>
  getKeys(): Promise<Uint8Array[]>
  getKeys(count: number, startKey?: Uint8Array): Promise<Uint8Array[]>
  getPairs(): Promise<[key: Uint8Array, value: v1.AccountInfo][]>
  getPairs(count: number, startKey?: Uint8Array): Promise<[key: Uint8Array, value: v1.AccountInfo][]>
}

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
    return this._chain.getStorageItemTypeHash('System', 'Account') === '899e5c31d20a5a43d06c9d35f416f0077331a2fd9bd7798124c5797c0ff72d26'
  }

  /**
   *  The full account information for a particular account ID.
   */
  get asV1(): SystemAccountStorageV1 {
    assert(this.isV1)
    return this as any
  }

  /**
   * Checks whether the storage item is defined for the current chain version.
   */
  get isExists(): boolean {
    return this._chain.getStorageItemTypeHash('System', 'Account') != null
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

  private async getKeys(count?: number, startKey?: any): Promise<any[]> {
    return this._chain.getKeys(this.blockHash, 'System', 'Account', count, startKey)
  }

  private async getPairs(count?: number, startKey?: any): Promise<any[][]> {
    return this._chain.getPairs(this.blockHash, 'System', 'Account', count, startKey)
  }
}
