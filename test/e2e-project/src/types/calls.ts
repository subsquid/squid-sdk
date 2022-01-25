import assert from 'assert'
import {CallContext, Result} from './support'
import * as v1 from './v1'

export class BalancesSetBalanceCall {
  constructor(private ctx: CallContext) {
    assert(this.ctx.extrinsic.name === 'balances.setBalance' || this.ctx.extrinsic.name === 'balances.set_balance')
  }

  /**
   *  Set the balances of a given account.
   * 
   *  This will alter `FreeBalance` and `ReservedBalance` in storage. it will
   *  also decrease the total issuance of the system (`TotalIssuance`).
   *  If the new free or reserved balance is below the existential deposit,
   *  it will reset the account nonce (`frame_system::AccountNonce`).
   * 
   *  The dispatch origin for this call is `root`.
   * 
   *  # <weight>
   *  - Independent of the arguments.
   *  - Contains a limited number of reads and writes.
   *  ---------------------
   *  - Base Weight:
   *      - Creating: 27.56 µs
   *      - Killing: 35.11 µs
   *  - DB Weight: 1 Read, 1 Write to `who`
   *  # </weight>
   */
  get isLatest(): boolean {
    return this.ctx._chain.getCallHash('balances.set_balance') === '99d45eea22d5909f0cca3c075a5bc2ebc4e35ab21cc987bd7c9e12eedc8ee727'
  }

  /**
   *  Set the balances of a given account.
   * 
   *  This will alter `FreeBalance` and `ReservedBalance` in storage. it will
   *  also decrease the total issuance of the system (`TotalIssuance`).
   *  If the new free or reserved balance is below the existential deposit,
   *  it will reset the account nonce (`frame_system::AccountNonce`).
   * 
   *  The dispatch origin for this call is `root`.
   * 
   *  # <weight>
   *  - Independent of the arguments.
   *  - Contains a limited number of reads and writes.
   *  ---------------------
   *  - Base Weight:
   *      - Creating: 27.56 µs
   *      - Killing: 35.11 µs
   *  - DB Weight: 1 Read, 1 Write to `who`
   *  # </weight>
   */
  get asLatest(): {who: v1.GenericMultiAddress, newFree: (number | bigint), newReserved: (number | bigint)} {
    assert(this.isLatest)
    return this.ctx._chain.decodeCall(this.ctx.extrinsic)
  }
}

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
