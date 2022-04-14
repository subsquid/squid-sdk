import assert from 'assert'
import {CallContext, Result, deprecateLatest} from './support'

export class BalancesSetBalanceCall {
  constructor(private ctx: CallContext) {
    assert(this.ctx.call.name === 'balances.setBalance' || this.ctx.call.name === 'balances.set_balance')
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
  get isV1(): boolean {
    return this.ctx._chain.getCallHash('balances.set_balance') === 'a65ed3500227691ff89565c1bf5a0244c2a05366e34d1ab50167d0c006774edc'
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
  get asV1(): {who: Uint8Array, newFree: bigint, newReserved: bigint} {
    assert(this.isV1)
    return this.ctx._chain.decodeCall(this.ctx.call)
  }

  get isLatest(): boolean {
    deprecateLatest()
    return this.isV1
  }

  get asLatest(): {who: Uint8Array, newFree: bigint, newReserved: bigint} {
    deprecateLatest()
    return this.asV1
  }
}

export class TimestampSetCall {
  constructor(private ctx: CallContext) {
    assert(this.ctx.call.name === 'timestamp.set')
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
  get isV1(): boolean {
    return this.ctx._chain.getCallHash('timestamp.set') === '6a8b8ba2be107f0853b674eec0026cc440b314db44d0e2c59b36e353355aed14'
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
  get asV1(): {now: bigint} {
    assert(this.isV1)
    return this.ctx._chain.decodeCall(this.ctx.call)
  }

  get isLatest(): boolean {
    deprecateLatest()
    return this.isV1
  }

  get asLatest(): {now: bigint} {
    deprecateLatest()
    return this.asV1
  }
}
