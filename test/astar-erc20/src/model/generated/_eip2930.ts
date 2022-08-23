import assert from "assert"
import * as marshal from "./marshal"

export class EIP2930 {
  public readonly isTypeOf = 'EIP2930'
  private _gasLimit!: bigint
  private _gasPrice!: bigint
  private _value!: bigint

  constructor(props?: Partial<Omit<EIP2930, 'toJSON'>>, json?: any) {
    Object.assign(this, props)
    if (json != null) {
      this._gasLimit = marshal.bigint.fromJSON(json.gasLimit)
      this._gasPrice = marshal.bigint.fromJSON(json.gasPrice)
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

  get gasPrice(): bigint {
    assert(this._gasPrice != null, 'uninitialized access')
    return this._gasPrice
  }

  set gasPrice(value: bigint) {
    this._gasPrice = value
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
      gasPrice: marshal.bigint.toJSON(this.gasPrice),
      value: marshal.bigint.toJSON(this.value),
    }
  }
}
