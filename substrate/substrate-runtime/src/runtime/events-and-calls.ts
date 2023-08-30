import {getTypeChecker, getTypeHash} from '@subsquid/scale-type-system'
import * as sts from '@subsquid/scale-type-system'
import assert from 'assert'
import {Ti, Type, TypeKind, Variant} from '../metadata'
import {QualifiedName} from './interfaces'


export interface EACDefinition extends Variant {
    pallet: string
}


export class EACRegistry {
    public readonly definitions: Record<QualifiedName, EACDefinition> = {}
    private typeRecords: Record<QualifiedName, TypeRecord> = {}

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

    has(name: QualifiedName): boolean {
        return this.definitions[name] != null
    }

    get(name: QualifiedName): EACDefinition {
        let def = this.definitions[name]
        if (def == null) throw new Error(`${name} not found`)
        return def
    }

    checkType(name: QualifiedName, ty: sts.Type): boolean {
        if (!this.has(name)) return false
        let rec = this.getTypeRecord(name)
        let ok = rec.checks.get(ty)
        if (ok == null) {
            ok = ty.match(getTypeChecker(this.types), rec.scaleType)
            rec.checks.set(ty, ok)
        }
        return ok
    }

    private getTypeRecord(name: QualifiedName): TypeRecord {
        let rec = this.typeRecords[name]
        if (rec == null) {
            rec = this.typeRecords[name] = {
                scaleType: this.createScaleType(name),
                checks: new WeakMap()
            }
        }
        return rec
    }

    private createScaleType(name: QualifiedName): Type {
        let def = this.get(name)
        if (def.fields.length == 0) return {
            kind: TypeKind.Tuple,
            tuple: []
        }
        if (def.fields[0].name == null) {
            if (def.fields.length == 1) {
                return this.types[def.fields[0].type]
            } else {
                return {
                    kind: TypeKind.Tuple,
                    tuple: def.fields.map(f => {
                        assert(f.name == null)
                        return f.type
                    })
                }
            }
        } else {
            return {
                kind: TypeKind.Composite,
                fields: def.fields
            }
        }
    }

    getTypeHash(name: QualifiedName): string {
        let rec = this.getTypeRecord(name)
        return getTypeHash(this.types, rec.scaleType)
    }
}


interface TypeRecord {
    scaleType: Type
    checks: WeakMap<sts.Type, boolean>
}
