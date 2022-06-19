import {Ti} from "@subsquid/scale-codec"
import assert from "assert"
import {QualifiedName, Type, TypeKind, Variant} from "./types"
import {getTypeHash} from "./types-hashing"
import {sha256} from "./util"


export interface Definition extends Variant {
    pallet: string
}


export class Registry {
    public readonly definitions: Record<QualifiedName, Definition> = {}
    private hashes: Record<QualifiedName, string> = {}

    constructor(private types: Type[], ti: Ti) {
        let pallets = types[ti]
        assert(pallets.kind == TypeKind.Variant)
        pallets.variants.forEach(pallet => {
            assert(pallet.fields.length == 1)
            let palletType = types[pallet.fields[0].type]
            assert(palletType.kind == TypeKind.Variant)
            palletType.variants.forEach(def => {
                this.definitions[`${pallet.name}.${def.name}`] = {
                    ...def,
                    pallet: pallet.name
                }
            })
        })
    }

    get(name: QualifiedName): Definition {
        let def = this.definitions[name]
        if (def == null) throw new Error(`${name} not found`)
        return def
    }

    getHash(name: QualifiedName): string {
        let hash = this.hashes[name]
        if (hash == null) {
            return this.hashes[name] = this.computeHash(name)
        } else {
            return hash
        }
    }

    private computeHash(name: QualifiedName): string {
        let def = this.get(name)
        let fields = def.fields.map(f => {
            return {
                name: f.name,
                type: getTypeHash(this.types, f.type)
            }
        })
        return sha256({
            fields
        })
    }
}
