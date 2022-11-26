import assert from "assert"
import * as marshal from "./marshal"
import {Poor, fromJsonPoor} from "./_poor"

export class MiddleClass {
    public readonly isTypeOf = 'MiddleClass'
    private _father!: Poor | undefined | null
    private _mother!: Poor | undefined | null

    constructor(props?: Partial<Omit<MiddleClass, 'toJSON'>>, json?: any) {
        Object.assign(this, props)
        if (json != null) {
            this._father = json.father == null ? undefined : fromJsonPoor(json.father)
            this._mother = json.mother == null ? undefined : fromJsonPoor(json.mother)
        }
    }

    get father(): Poor | undefined | null {
        return this._father
    }

    set father(value: Poor | undefined | null) {
        this._father = value
    }

    get mother(): Poor | undefined | null {
        return this._mother
    }

    set mother(value: Poor | undefined | null) {
        this._mother = value
    }

    toJSON(): object {
        return {
            isTypeOf: this.isTypeOf,
            father: this.father == null ? undefined : this.father.toJSON(),
            mother: this.mother == null ? undefined : this.mother.toJSON(),
        }
    }
}
