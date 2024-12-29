import assert from 'assert'
import {Bytes32, Qty} from '../interfaces/base.js'


export function qty2Int(qty: Qty): number {
    let i = parseInt(qty, 16)
    assert(Number.isSafeInteger(i))
    return i
}


export function toQty(i: number): Qty {
    return '0x' + i.toString(16)
}


export function getTxHash(tx: Bytes32 | {hash: Bytes32}): Bytes32 {
    if (typeof tx == 'string') {
        return tx
    } else {
        return tx.hash
    }
}

export class Graph {
    public graph: Map<string, string[]>;

    constructor() {
        this.graph = new Map();
    }
    addEdge(u: string, v: string) {
        if (!this.graph.has(u)) {
            this.graph.set(u, []);
        }
        this.graph.get(u)!.push(v);
    }
    topologicalSortUtil(v: string, visited: Set<string>, stack: Array<string>) {
        visited.add(v);
        const neighbors = this.graph.get(v) || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                this.topologicalSortUtil(neighbor, visited, stack);
            }
        }
        stack.push(v);
    }
    topologicalSort() {
        const visited = new Set<string>();
        const stack: string[] = [];
        for (const vertex of this.graph.keys()) {
            if (!visited.has(vertex)) {
                this.topologicalSortUtil(vertex, visited, stack);
            }
        }
        return stack.reverse();
    }
  }