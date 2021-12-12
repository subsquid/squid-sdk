import assert from "assert"
import * as marshal from "../marshal"
import {AdditionalData} from "./additionalData"

export class EventParam {
  private _name!: string | undefined | null
  private _type!: string | undefined | null
  private _value!: string | undefined | null
  private _additionalData!: (AdditionalData)[] | undefined | null

  constructor(props?: Partial<Omit<EventParam, 'toJSON'>>, json?: any) {
    Object.assign(this, props)
    if (json != null) {
      this._name = json.name == null ? undefined : marshal.string.fromJSON(json.name)
      this._type = json.type == null ? undefined : marshal.string.fromJSON(json.type)
      this._value = json.value == null ? undefined : marshal.string.fromJSON(json.value)
      this._additionalData = json.additionalData == null ? undefined : marshal.fromList(json.additionalData, val => new AdditionalData(undefined, marshal.nonNull(val)))
    }
  }

  get name(): string | undefined | null {
    return this._name
  }

  set name(value: string | undefined | null) {
    this._name = value
  }

  get type(): string | undefined | null {
    return this._type
  }

  set type(value: string | undefined | null) {
    this._type = value
  }

  get value(): string | undefined | null {
    return this._value
  }

  set value(value: string | undefined | null) {
    this._value = value
  }

  get additionalData(): (AdditionalData)[] | undefined | null {
    return this._additionalData
  }

  set additionalData(value: (AdditionalData)[] | undefined | null) {
    this._additionalData = value
  }

  toJSON(): object {
    return {
      name: this.name,
      type: this.type,
      value: this.value,
      additionalData: this.additionalData == null ? undefined : this.additionalData.map((val: any) => val.toJSON()),
    }
  }
}
