import assert from "assert"
import * as marshal from "./marshal"

export class NestedScalars {
  private _float!: number | undefined | null
  private _json!: unknown | undefined | null

  constructor(props?: Partial<Omit<NestedScalars, 'toJSON'>>, json?: any) {
    Object.assign(this, props)
    if (json != null) {
      this._float = json.float == null ? undefined : marshal.float.fromJSON(json.float)
      this._json = json.json
    }
  }

  get float(): number | undefined | null {
    return this._float
  }

  set float(value: number | undefined | null) {
    this._float = value
  }

  get json(): unknown | undefined | null {
    return this._json
  }

  set json(value: unknown | undefined | null) {
    this._json = value
  }

  toJSON(): object {
    return {
      float: this.float,
      json: this.json,
    }
  }
}
