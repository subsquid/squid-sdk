import assert from 'assert'
import {Block, Chain, ChainContext, BlockContext, Result} from './support'

export class SystemSS58PrefixConstant {
  private readonly _chain: Chain

  constructor(ctx: ChainContext) {
    this._chain = ctx._chain
  }

  /**
   *  The designated SS85 prefix of this chain.
   * 
   *  This replaces the "ss58Format" property declared in the chain spec. Reason is
   *  that the runtime should know about the prefix in order to make use of it as
   *  an identifier of the chain.
   */
  get isV2028() {
    return this._chain.getConstantTypeHash('System', 'SS58Prefix') === '2708cedf93fed7bee3322af320ea219005dcb55f9862ac9efe54952fdad23f7e'
  }

  /**
   *  The designated SS85 prefix of this chain.
   * 
   *  This replaces the "ss58Format" property declared in the chain spec. Reason is
   *  that the runtime should know about the prefix in order to make use of it as
   *  an identifier of the chain.
   */
  get asV2028(): number {
    assert(this.isV2028)
    return this._chain.getConstant('System', 'SS58Prefix')
  }

  /**
   *  The designated SS85 prefix of this chain.
   * 
   *  This replaces the "ss58Format" property declared in the chain spec. Reason is
   *  that the runtime should know about the prefix in order to make use of it as
   *  an identifier of the chain.
   */
  get isV9050() {
    return this._chain.getConstantTypeHash('System', 'SS58Prefix') === '9b69f402e701537d10790f5d9964d91bc1eac970e385f34788d6e9aeada070a1'
  }

  /**
   *  The designated SS85 prefix of this chain.
   * 
   *  This replaces the "ss58Format" property declared in the chain spec. Reason is
   *  that the runtime should know about the prefix in order to make use of it as
   *  an identifier of the chain.
   */
  get asV9050(): number {
    assert(this.isV9050)
    return this._chain.getConstant('System', 'SS58Prefix')
  }

  /**
   * Checks whether the constant is defined for the current chain version.
   */
  get isExists(): boolean {
    return this._chain.getConstantTypeHash('System', 'SS58Prefix') != null
  }
}
