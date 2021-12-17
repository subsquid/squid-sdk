import assert from "assert"
import * as marshal from "./marshal"

export class AdditionalData {
  private _data!: Buffer | undefined | null

  constructor(props?: Partial<Omit<AdditionalData, 'toJSON'>>, json?: any) {
    Object.assign(this, props)
    if (json != null) {
      this._data = json.data == null ? undefined : marshal.bytes.fromJSON(json.data)
    }
  }

  get data(): Buffer | undefined | null {
    return this._data
  }

  set data(value: Buffer | undefined | null) {
    this._data = value
  }

  toJSON(): object {
    return {
      data: this.data == null ? undefined : marshal.bytes.toJSON(this.data),
    }
  }
}
