import {RuntimeDescription, Ti, Type, TypeKind} from '@subsquid/substrate-runtime/lib/metadata'
import {getTypeHash} from '@subsquid/substrate-runtime/lib/sts'
import assert from 'assert'
import {asOptionType, asResultType} from './util'


/**
 * Assign names to types
 */
export function assignNames(d: RuntimeDescription): Map<Ti, string> {
    let names = new Names(d.types)

    // assign good names for events and calls
    names.assign(d.call, 'Call')
    names.assign(d.event, 'Event')
    forEachPallet(d.types, d.call, (pallet, ti) => {
        names.assign(ti, pallet + 'Call')
    })
    forEachPallet(d.types, d.event, (pallet, ti) => {
        names.assign(ti, pallet + 'Event')
    })

    return names.getAssignment()
}


function forEachPallet(types: Type[], ti: Ti, cb: (name: string, ti: Ti) => void): void {
    let type = types[ti]
    assert(type.kind == TypeKind.Variant)
    type.variants.forEach(v => {
        assert(v.fields.length == 1)
        let vi = v.fields[0].type
        cb(v.name, vi)
    })
}


export class Names {
    private assignment = new Map<Ti, string>()
    private assigned = new Map<string, string>() // Map<Name, TypeHash>
    private reserved = new Set<string>(['Result', 'Option', 'Bytes', 'BitSequence'])
    private aliases = new Map<Ti, Set<string>>()

    constructor(private types: Type[]) {}

    assign(ti: Ti, name: string): void {
        assert(this.isFree(name))
        this.assigned.set(name, getTypeHash(this.types, ti))
        this.assignment.set(ti, name)
    }

    private isFree(name: string): boolean {
        return !(this.reserved.has(name) || this.assigned.has(name))
    }

    reserve(name: string): void {
        assert(this.isFree(name))
        this.reserved.add(name)
    }

    alias(ti: Ti, name: string): void {
        let aliases = this.aliases.get(ti)
        if (aliases) {
            aliases.add(name)
        } else {
            this.aliases.set(ti, new Set([name]))
        }
    }

    getAssignment(): Map<Ti, string> {
        this.types.forEach((type, ti) => {
            if (this.assignment.has(ti)) return
            if (!needsName(this.types, ti)) return

            let name = deriveName(type)
            if (name && this.isFree(name)) {
                this.assign(ti, name)
                return
            }

            for (let name of this.aliases.get(ti)?.values() || []) {
                if (this.isFree(name)) {
                    this.assign(ti, name)
                    return
                }
            }

            this.assign(ti, `Type_${ti}`)
        })

        this.types.forEach((type, ti) => {
            if (this.assignment.has(ti)) return
            if (type.kind == TypeKind.Sequence) return

            let name = deriveName(type)
            if (name && this.isFree(name)) {
                this.assign(ti, name)
            }
        })

        this.types.forEach((type, ti) => {
            if (this.assignment.has(ti)) return
            if (type.kind == TypeKind.Sequence) return

            let aliases = this.aliases.get(ti)
            if (aliases?.size !== 1) return
            let name = Array.from(aliases)[0]
            if (this.isFree(name)) {
                this.assign(ti, name)
            }
        })

        return this.assignment
    }
}


/**
 * Derive "the best" name from the path.
 */
export function deriveName(type: Type): string | undefined {
    if (!type.path?.length) return undefined
    let version = type.path.find(name => /^v\d+$/i.test(name))
    let name = type.path[type.path.length - 1]
    if (version && version !== name ) {
        return `V${version.slice(1)}${name}`
    } else {
        return name
    }
}


export function needsName(types: Type[], ti: Ti): boolean {
    let ty = types[ti]
    switch(ty.kind) {
        case TypeKind.Variant:
            return !asResultType(ty) && !asOptionType(ty)
        case TypeKind.Composite:
            return true
        default:
            return false
    }
}
