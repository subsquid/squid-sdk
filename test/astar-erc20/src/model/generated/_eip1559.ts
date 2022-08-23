import assert from "assert"
import * as marshal from "./marshal"

export class EIP1559 {
  public readonly isTypeOf = 'EIP1559'
  private _gasLimit!: bigint
  private _maxPriorityFeePerGas!: bigint
  private _maxFeePerGas!: bigint
  private _value!: bigint

  constructor(props?: Partial<Omit<EIP1559, 'toJSON'>>, json?: any) {
    Object.assign(this, props)
    if (json != null) {
      this._gasLimit = marshal.bigint.fromJSON(json.gasLimit)
      this._maxPriorityFeePerGas = marshal.bigint.fromJSON(json.maxPriorityFeePerGas)
      this._maxFeePerGas = marshal.bigint.fromJSON(json.maxFeePerGas)
      this._value = marshal.bigint.fromJSON(json.value)
    }
  }

  get gasLimit(): bigint {
    assert(this._gasLimit != null, 'uninitialized access')
    return this._gasLimit
  }

  set gasLimit(value: bigint) {
    this._gasLimit = value
  }

  get maxPriorityFeePerGas(): bigint {
    assert(this._maxPriorityFeePerGas != null, 'uninitialized access')
    return this._maxPriorityFeePerGas
  }

  set maxPriorityFeePerGas(value: bigint) {
    this._maxPriorityFeePerGas = value
  }

  get maxFeePerGas(): bigint {
    assert(this._maxFeePerGas != null, 'uninitialized access')
    return this._maxFeePerGas
  }

  set maxFeePerGas(value: bigint) {
    this._maxFeePerGas = value
  }

  get value(): bigint {
    assert(this._value != null, 'uninitialized access')
    return this._value
  }

  set value(value: bigint) {
    this._value = value
  }

  toJSON(): object {
    return {
      isTypeOf: this.isTypeOf,
      gasLimit: marshal.bigint.toJSON(this.gasLimit),
      maxPriorityFeePerGas: marshal.bigint.toJSON(this.maxPriorityFeePerGas),
      maxFeePerGas: marshal.bigint.toJSON(this.maxFeePerGas),
      value: marshal.bigint.toJSON(this.value),
    }
  }
}
