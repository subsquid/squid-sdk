import {getUnwrappedType} from "@subsquid/scale-codec/lib/types-codec"
import {ChainDescription, getTypeHash, Ti, Type, TypeKind} from "@subsquid/substrate-metadata"
import assert from "assert"
import {asResultType} from "./util"

/**
 * Assign names to types
 */
export function assignNames(d: ChainDescription): Map<Ti, string> {
    let types = d.types
    let assignment = new Map<number, string>()
    let reserved = new Set<string>()

    reserved.add('Result')

    function assign(ti: Ti, name: string): void {
        assignment.set(ti, name)
        reserved.add(name)
    }

    // assign good names for events and calls
    assign(d.call, 'Call')
    assign(d.event, 'Event')
    forEachPallet(types, d.call, (pallet, ti) => {
        assign(ti, pallet + 'Call')
    })
    forEachPallet(types, d.event, (pallet, ti) => {
        assign(ti, pallet + 'Event')
    })

    // a mapping between a name and types which want to have it
    let names = new Map<string, Ti[]>()

    types.forEach((type, ti) => {
        if (assignment.has(ti)) return
        let name = deriveName(type)
        if (name && reserved.has(name)) {
            name = undefined
        }
        if (name == null && needsName(types, ti)) {
            name = `Type_${ti}`
        }
        if (name) {
            let list = names.get(name)
            if (list == null) {
                list = []
                names.set(name, list)
            }
            list.push(ti)
        }
    })

    distributeNames(types, names.entries(), assignment)

    return assignment
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


export function distributeNames(
    types: Type[],
    names: Iterable<[name: string, candidates: Ti[]]>,
    assignment: Map<Ti, string>
): void {
    for (let [name, candidates] of names) {
        let hashes = new Map<string, Ti>()

        for (let i = 0; i < 2; i++) {
            candidates.forEach(ti => {
                let hash = getTypeHash(types, ti)
                if (hashes.has(hash)) return
                hashes.set(hash, ti)
            })

            if (hashes.size == 1) {
                candidates.forEach(ti => assignment.set(ti, name))
                return
            }

            candidates = candidates.filter(ti => needsName(types, ti))
            hashes.clear()
        }

        let hashToName = new Map<string, string>()

        candidates.forEach(ti => {
            let hash = getTypeHash(types, ti)
            let assignedName = hashToName.get(hash)
            if (assignedName == null) {
                assignedName = `${name}_${ti}`
                hashToName.set(hash, assignedName)
            }
            assignment.set(ti, assignedName)
        })
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
            return !asResultType(type)
        case TypeKind.Composite:
            return true
        default:
            return false
    }
}

//
// export class NameAssignment {
//     private assignment = new Map<Ti, string>()
//     private reserved = new Set<string>(['Result'])
//     private aliases: [name: string, ti: Ti][] = []
//
//     constructor(private types: Type[]) {}
//
//     assign(ti: Ti, name: string): void {
//         this.reserved.add(name)
//         this.assignment.set(ti, name)
//     }
//
//     alias(ti: Ti, name: string): void {
//         this.aliases.push([name, ti])
//     }
//
//     getAssignment() {
//         this.types.forEach((type, ti) => {
//             if (this.assignment.has(ti)) return
//
//         })
//     }
// }
