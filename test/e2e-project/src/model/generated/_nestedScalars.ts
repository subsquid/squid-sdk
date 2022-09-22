import {BigDecimal} from "@subsquid/big-decimal"
import assert from "assert"
import * as marshal from "./marshal"
import {EnumInJson} from "./_enumInJson"

export class NestedScalars {
  private _float!: number | undefined | null
  private _json!: unknown | undefined | null
  private _enumInJson!: EnumInJson | undefined | null
  private _bigdecimal!: BigDecimal | undefined | null

  constructor(props?: Partial<Omit<NestedScalars, 'toJSON'>>, json?: any) {
    Object.assign(this, props)
    if (json != null) {
      this._float = json.float == null ? undefined : marshal.float.fromJSON(json.float)
      this._json = json.json
      this._enumInJson = json.enumInJson == null ? undefined : marshal.enumFromJson(json.enumInJson, EnumInJson)
      this._bigdecimal = json.bigdecimal == null ? undefined : marshal.bigdecimal.fromJSON(json.bigdecimal)
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

  get enumInJson(): EnumInJson | undefined | null {
    return this._enumInJson
  }

  set enumInJson(value: EnumInJson | undefined | null) {
    this._enumInJson = value
  }

  get bigdecimal(): BigDecimal | undefined | null {
    return this._bigdecimal
  }

  set bigdecimal(value: BigDecimal | undefined | null) {
    this._bigdecimal = value
  }

  toJSON(): object {
    return {
      float: this.float,
      json: this.json,
      enumInJson: this.enumInJson,
      bigdecimal: this.bigdecimal == null ? undefined : marshal.bigdecimal.toJSON(this.bigdecimal),
    }
  }
}
