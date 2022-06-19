import {assertNotNull, unexpectedCase} from "@subsquid/util-internal"
import assert from "assert"
import {Ti, Type, TypeKind, TypeRegistry} from "./types"
import {sha256} from "./util"


const HASHERS = new WeakMap<TypeRegistry, TypeHasher>()


export function getTypeHasher(registry: TypeRegistry): TypeHasher {
    let hasher = HASHERS.get(registry)
    if (hasher == null) {
        hasher = new TypeHasher(registry)
        HASHERS.set(registry, hasher)
    }
    return hasher
}


/**
 * Get a strong hash of substrate type, which can be used for equality derivation
 */
export function getTypeHash(registry: TypeRegistry, type: Ti): string {
    return getTypeHasher(registry).getHash(type)
}

/**
 * https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm
 */
interface HashNode {
    index: number
    lowIndex: number
    onStack: boolean
    hash: string
    component?: number
}

/**
 * Computes hashes of substrate types for the purpose of equality derivation.
 *
 * Substrate types form a cyclic directed graph.
 * Two types are equal when their depth-first traversal trees are equal.
 * Inline with equality, we define a type hash to be a merkel hash of it's depth-first traversal.
 *
 * Note, that unlike a classic tree case we might need
 * to visit mutually recursive type nodes more than once.
 *
 * Naive approach of performing a depth-first traversal for each node might not work,
 * as we typically have around 10^3 nodes in a graph. This is on a verge of being slow.
 *
 * Hence, the following procedure:
 *  1. We embed Tarjan's strongly connected components algorithm in our hash computation to discover and
 *  persist information about strongly connected components.
 *  2. For each strongly connected component, we cache the resulting hash per entry point.
 *
 * This allows us to visit non-mutually recursive types only once and makes the overall procedure
 * quadratic only on the size of a maximal strongly connected component, which practically should not be big.
 */
export class TypeHasher {
    private cache: string[]

    private index = 1
    private nodes: (HashNode | undefined)[]
    private stack: Ti[] = []

    constructor(private types: Type[]) {
        this.cache = new Array(types.length).fill('')
        this.nodes = new Array(types.length)
    }

    getHash(type: Ti): string {
        assert(type >= 0 && type < this.types.length)
        let hash = this.cache[type]
        if (hash) return hash
        return this.hash(type, { // dummy root node
            index: 0,
            lowIndex: 0,
            onStack: false,
            hash: '',
            component: 0
        })
    }

    private hash(ti: Ti, parent: HashNode): string {
        let node = this.nodes[ti]
        if (node) {
            // We already visited this node before, which could happen because:
            // 1. We visited it during a previous traversal
            // 2. We visited it during a current traversal
            if (node.onStack) {
                // This is certainly a current traversal,
                parent.lowIndex = Math.min(parent.lowIndex, node.index)
                return node.hash
            }
            if (node.hash) {
                // This is a current traversal.
                // Parent and node belong to the same component.
                // In all other cases `node.hash` is empty.
                return node.hash
            }
            // This is a previous traversal, or we already exited
            // the strongly connected component of a `node`.
            assert(node.component != null) // In any case component information must be available.
            if (node.component !== parent.component) {
                // We are entering the strongly connected component.
                // We can return a hash right away if we entered it via this node before.
                let hash = this.cache[ti]
                if (hash) return hash
            }
            // Otherwise, perform a regular Tarjan's visit as nothing happened.
        }
        node = {
            index: this.index,
            lowIndex: this.index,
            onStack: true,
            hash: '',
            component: node?.component
        }
        this.index += 1
        this.nodes[ti] = node
        this.stack.push(ti)
        let hashObj = this.makeHash(ti, node)
        let hash = node.hash = typeof hashObj == 'string' ? hashObj : sha256(hashObj)
        if (node.index == node.lowIndex) {
            let n
            do {
                n = this.nodes[this.stack.pop()!]!
                n.onStack = false
                n.component = node.index
                n.hash = ''
            } while (n !== node)
            this.cache[ti] = hash
        } else {
            parent.lowIndex = Math.min(parent.lowIndex, node.lowIndex)
        }
        return hash
    }

    private makeHash(ti: Ti, parent: HashNode): object | string {
        let type = this.types[ti]
        switch(type.kind) {
            case TypeKind.Primitive:
                return {primitive: type.primitive}
            case TypeKind.Compact:
                return {compact: this.hash(type.type, parent)}
            case TypeKind.Sequence:
                return {sequence: this.hash(type.type, parent)}
            case TypeKind.Array:
                return {
                    array: {
                        len: type.len,
                        type: this.hash(type.type, parent)
                    }
                }
            case TypeKind.BitSequence:
                return {
                    bitSequence: true
                }
            case TypeKind.Tuple:
                return this.hashTuple(type.tuple, parent)
            case TypeKind.Composite:
                if (type.fields[0]?.name == null) {
                    return this.hashTuple(type.fields.map(f => {
                        assert(f.name == null)
                        return f.type
                    }), parent)
                } else {
                    let struct: any = {}
                    type.fields.forEach(f => {
                        let name = assertNotNull(f.name)
                        struct[name] = this.hash(f.type, parent)
                    })
                    return {struct}
                }
            case TypeKind.Variant: {
                let desc: any = {}
                type.variants.forEach(v => {
                    desc[v.name] = v.fields.map((f, idx) => {
                        let name = f.name || idx
                        return {
                            name,
                            type: this.hash(f.type, parent)
                        }
                    })
                })
                return {variant: desc}
            }
            case TypeKind.Option:
                return {
                    option: this.hash(type.type, parent)
                }
            case TypeKind.DoNotConstruct:
                return {doNotConstruct: true}
            default:
                throw unexpectedCase()
        }
    }

    private hashTuple(items: Ti[], parent: HashNode): object | string {
        if (items.length == 1) {
            return this.hash(items[0], parent)
        } else {
            return {
                tuple: items.map(it => this.hash(it, parent))
            }
        }
    }
}
