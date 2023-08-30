import * as crypto from 'crypto'
import {assertNotNull} from '@subsquid/util-internal'
import assert from 'assert'


type Ni = number
type Hash = string


export interface Hasher {
    getHash(nodeIndex: Ni): Hash
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
 * Substrate types form a cyclic directed graph with labeled edges.
 * Two types are equal when their depth-first traversal trees are equal.
 * Inline with equality, we define a type hash to be a merkel hash of it's depth-first traversal.
 *
 * Note, that unlike a classic tree case we might need
 * to visit mutually recursive type nodes more than once.
 *
 * Naive approach of performing a depth-first traversal for each node might be slow.
 *
 * Hence, the following procedure:
 *  1. We embed Tarjan's strongly connected components algorithm in our hash computation to discover and
 *  persist information about strongly connected components.
 *  2. For each strongly connected component, we cache the resulting hash per entry point.
 *
 * This allows us to visit non-mutually recursive types only once and makes the overall procedure
 * quadratic only on the size of a maximal strongly connected component, which practically should not be large.
 */
export class DCGHasher<N> implements Hasher {
    private cache: string[]

    private index = 1
    private nodes: (HashNode | undefined)[]
    private stack: Ni[] = []
    private parentNode: HashNode | undefined

    constructor(
        private graph: N[],
        private computeHash: (graph: N[], hasher: DCGHasher<N>, type: N) => object
    ) {
        this.cache = new Array(graph.length).fill('')
        this.nodes = new Array(graph.length)
    }

    getHash(ni: Ni): Hash {
        assert(0 <= ni && ni < this.graph.length)
        if (this.parentNode == null) {
            let hash = this.cache[ni]
            if (hash) return hash
            return this.traverse(ni)
        } else {
            return this.visit(ni)
        }
    }

    private traverse(ni: Ni): Hash {
        this.parentNode = { // dummy root node
            index: 0,
            lowIndex: 0,
            onStack: false,
            hash: '',
            component: 0
        }
        try {
            return this.visit(ni)
        } finally {
            this.parentNode = undefined
        }
    }

    private visit(ni: Ni): Hash {
        let parent = assertNotNull(this.parentNode)
        let node = this.nodes[ni]
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
                let hash = this.cache[ni]
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
        this.nodes[ni] = node
        this.stack.push(ni)

        let merkelObj
        this.parentNode = node
        try {
            merkelObj = this.computeHash(this.graph, this, this.graph[ni])
        } finally {
            this.parentNode = parent
        }

        let hash = sha(merkelObj)

        if (node.index == node.lowIndex) {
            let n
            do {
                n = this.nodes[this.stack.pop()!]!
                n.onStack = false
                n.component = node.index
                n.hash = ''
            } while (n !== node)
            this.cache[ni] = hash
        } else {
            parent.lowIndex = Math.min(parent.lowIndex, node.lowIndex)
        }

        return hash
    }
}


export function sha(obj: object): Hash {
    let content = JSON.stringify(obj)
    let hash = crypto.createHash('sha256')
    hash.update(content)
    return hash.digest().toString('hex', 0, 16)
}
