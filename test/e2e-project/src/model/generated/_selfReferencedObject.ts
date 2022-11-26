import assert from "assert"
import * as marshal from "./marshal"

export class SelfReferencedObject {
    private _ref!: SelfReferencedObject | undefined | null

    constructor(props?: Partial<Omit<SelfReferencedObject, 'toJSON'>>, json?: any) {
        Object.assign(this, props)
        if (json != null) {
            this._ref = json.ref == null ? undefined : new SelfReferencedObject(undefined, json.ref)
        }
    }

    get ref(): SelfReferencedObject | undefined | null {
        return this._ref
    }

    set ref(value: SelfReferencedObject | undefined | null) {
        this._ref = value
    }

    toJSON(): object {
        return {
            ref: this.ref == null ? undefined : this.ref.toJSON(),
        }
    }
}
