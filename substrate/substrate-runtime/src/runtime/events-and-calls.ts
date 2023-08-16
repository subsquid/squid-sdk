import assert from 'assert'
import {Ti, Type, TypeKind, Variant} from '../metadata'
import {QualifiedName} from './interfaces'


export interface EACDefinition extends Variant {
    pallet: string
}


export class EACRegistry {
    public readonly definitions: Record<QualifiedName, EACDefinition> = {}

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

    get(name: QualifiedName): EACDefinition {
        let def = this.definitions[name]
        if (def == null) throw new Error(`${name} not found`)
        return def
    }
}
