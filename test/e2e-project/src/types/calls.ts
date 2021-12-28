import assert from 'assert'
import {CallContext, Result} from './support'

export class TimestampSetCall {
  constructor(private ctx: CallContext) {
    assert(this.ctx.extrinsic.name === 'timestamp.set')
  }

  /**
   *  Set the current time.
   * 
   *  This call should be invoked exactly once per block. It will panic at the finalization
   *  phase, if this call hasn't been invoked by that time.
   * 
   *  The timestamp should be greater than the previous one by the amount specified by
   *  `MinimumPeriod`.
   * 
   *  The dispatch origin for this call must be `Inherent`.
   * 
   *  # <weight>
   *  - `O(T)` where `T` complexity of `on_timestamp_set`
   *  - 1 storage read and 1 storage mutation (codec `O(1)`). (because of `DidUpdate::take` in `on_finalize`)
   *  - 1 event handler `on_timestamp_set` `O(T)`.
   *  # </weight>
   */
  get isLatest(): boolean {
    return this.ctx._chain.getCallHash('timestamp.set') === '3c832e2f9c65e106d08e422b5962c90f9f8bc4c4172cb0bf1927eb3c2b23f6ce'
  }

  /**
   *  Set the current time.
   * 
   *  This call should be invoked exactly once per block. It will panic at the finalization
   *  phase, if this call hasn't been invoked by that time.
   * 
   *  The timestamp should be greater than the previous one by the amount specified by
   *  `MinimumPeriod`.
   * 
   *  The dispatch origin for this call must be `Inherent`.
   * 
   *  # <weight>
   *  - `O(T)` where `T` complexity of `on_timestamp_set`
   *  - 1 storage read and 1 storage mutation (codec `O(1)`). (because of `DidUpdate::take` in `on_finalize`)
   *  - 1 event handler `on_timestamp_set` `O(T)`.
   *  # </weight>
   */
  get asLatest(): {now: (number | bigint)} {
    assert(this.isLatest)
    return this.ctx._chain.decodeCall(this.ctx.extrinsic)
  }
}
