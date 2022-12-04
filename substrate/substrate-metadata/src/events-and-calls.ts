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
        for (let def of getGlobalVariants(types, ti)) {
            this.definitions[`${def.pallet}.${def.name}`] = def
        }
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
        return getVariantHash(this.types, def)
    }
}


export function* getGlobalVariants(types: Type[], ti: Ti): Iterable<Definition> {
    let pallets = types[ti]
    assert(pallets.kind == TypeKind.Variant)
    for (let pallet of pallets.variants) {
        assert(pallet.fields.length == 1)
        let variantType = types[pallet.fields[0].type]
        assert(variantType.kind == TypeKind.Variant)
        for (let v of variantType.variants) {
            yield {...v, pallet: pallet.name}
        }
    }
}


export function getVariantHash(types: Type[], variant: Variant): string {
    let fields = variant.fields.map(f => {
        return {
            name: f.name,
            type: getTypeHash(types, f.type)
        }
    })
    return sha256({
        fields
    })
}
