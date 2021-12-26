import {getTypeHash, Ti, Type, TypeKind} from "@subsquid/substrate-metadata"

/**
 * Assign names to types
 */
export function assignNames(types: Type[]): Map<Ti, string> {
    let assignment = new Map<number, string>()

    getNames(types).forEach((tis, name) => {
        let hashes = new Map<string, Ti>()

        for (let i = 0; i < 2; i++) {
            tis.forEach(ti => {
                let hash = getTypeHash(types, ti)
                if (hashes.has(hash)) return
                hashes.set(hash, ti)
            })

            if (hashes.size == 1) {
                tis.forEach(ti => assignment.set(ti, name))
                return
            }

            tis = tis.filter(ti => needsName(types[ti]))
            hashes.clear()
        }

        let assigned = new Map<string, string>()

        tis.forEach(ti => {
            let type = types[ti]
            let hash = getTypeHash(types, ti)
            let assignedName = assigned.get(hash)
            if (assignedName == null) {
                assignedName = `${name}_${ti}`
                assigned.set(hash, assignedName)
            }
            assignment.set(ti, assignedName)
        })
    })

    return assignment
}


/**
 * Compute a mapping between a name and actual types which want to have it
 */
function getNames(types: Type[]): Map<string, Ti[]> {
    let names = new Map<string, Ti[]>()

    types.forEach((type, ti) => {
        let name = getName(type)
        if (name == null && needsName(type)) {
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


    return names
}


/**
 * Derive "the best" name from a path.
 */
function getName(type: Type): string | undefined {
    if (!type.path?.length) return undefined
    let version = type.path.find(name => /^v\d+$/i.test(name))
    let name = type.path[type.path.length - 1]
    if (version && version !== name ) {
        return `V${version.slice(1)}${name}`
    } else {
        return name
    }
}


export function needsName(type: Type): boolean {
    switch(type.kind) {
        case TypeKind.Variant:
            return true
        case TypeKind.Composite:
            return type.fields.length > 0 && type.fields[0].name != null
        default:
            return false
    }
}
