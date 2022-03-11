import assert from 'assert'
import {StorageContext, Result} from './support'
import * as v1 from './v1'

export class SystemAccountStorage {
  constructor(private ctx: StorageContext) {}

  /**
   *  The full account information for a particular account ID.
   */
  get isV1() {
    return this.ctx._chain.getStorageItemTypeHash('System', 'Account') === 'eb40f1d91f26d72e29c60e034d53a72b9b529014c7e108f422d8ad5f03f0c902'
  }

  /**
   *  The full account information for a particular account ID.
   */
  async getAsV1(key: Uint8Array): Promise<v1.AccountInfoWithRefCount> {
    assert(this.isV1)
    return this.ctx._chain.getStorage(this.ctx.block.hash, 'System', 'Account', key)
  }
}
