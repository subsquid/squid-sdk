import {getUnwrappedType} from "@subsquid/scale-codec/lib/types-codec"
import {ChainDescription, getTypeHash, Ti, Type, TypeKind} from "@subsquid/substrate-metadata"
import assert from "assert"
import {asOptionType, asResultType} from './util'

/**
 * Assign names to types
 */
export function assignNames(d: ChainDescription): Map<Ti, string> {
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
    private reserved = new Set<string>(['Result', 'Option'])
    private aliases = new Map<Ti, Set<string>>()

    constructor(private types: Type[]) {}

    assign(ti: Ti, name: string): void {
        assert(this.isValidAssignment(ti, name))
        this.assigned.set(name, getTypeHash(this.types, ti))
        this.assignment.set(ti, name)
    }

    private isValidAssignment(ti: Ti, name: string): boolean {
        if (this.reserved.has(name)) return false
        let hash = this.assigned.get(name)
        return hash == null || getTypeHash(this.types, ti) == hash
    }

    reserve(name: string): void {
        assert(!this.assigned.has(name))
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
            if (name && this.isValidAssignment(ti, name)) {
                this.assign(ti, name)
                return
            }

            for (let name of this.aliases.get(ti)?.values() || []) {
                if (this.isValidAssignment(ti, name)) {
                    this.assign(ti, name)
                    return
                }
            }

            this.assign(ti, `Type_${ti}`)
        })

        this.types.forEach((type, ti) => {
            if (this.assignment.has(ti)) return
            let aliases = this.aliases.get(ti)
            if (aliases?.size !== 1) return
            let name = Array.from(aliases)[0]
            if (this.isValidAssignment(ti, name)) {
                this.assign(ti, name)
            }
        })

        return this.assignment
    }
}


/**
 * Derive "the best" name from a path.
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
    let type = getUnwrappedType(types, ti)
    switch(type.kind) {
        case TypeKind.Variant:
            return !(asResultType(type) || asOptionType(type))
        case TypeKind.Composite:
            return true
        default:
            return false
    }
}
