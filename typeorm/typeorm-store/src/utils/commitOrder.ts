import {EntityMetadata} from 'typeorm'
import {RelationMetadata} from 'typeorm/metadata/RelationMetadata'

enum NodeState {
    Unvisited,
    Visiting,
    Visited,
}

export function sortMetadatasInCommitOrder(entities: EntityMetadata[]): EntityMetadata[] {
    let states: Map<string, NodeState> = new Map(entities.map((e) => [e.name, NodeState.Unvisited]))
    let commitOrder: EntityMetadata[] = []

    function visit(node: EntityMetadata) {
        if (states.get(node.name) !== NodeState.Unvisited) return

        states.set(node.name, NodeState.Visiting)

        for (let edge of node.relations) {
            if (edge.foreignKeys.length === 0) continue

            let target = edge.inverseEntityMetadata
            let targetState = states.get(target.name)

            if (targetState === NodeState.Unvisited) {
                visit(target)
            } else if (targetState === NodeState.Visiting) {
                let inverseEdge = target.relations.find((r) => r.inverseEntityMetadata === node)
                if (inverseEdge != null) {
                    let edgeWeight = getWeight(edge)
                    let inverseEdgeWeight = getWeight(inverseEdge)

                    if (edgeWeight > inverseEdgeWeight) {
                        for (let r of target.relations) {
                            visit(r.inverseEntityMetadata)
                        }

                        states.set(target.name, NodeState.Visited)
                        commitOrder.push(target)
                    }
                }
            }
        }

        let nodeState = states.get(node.name)

        if (nodeState !== NodeState.Visited) {
            states.set(node.name, NodeState.Visited)
            commitOrder.push(node)
        }
    }

    for (let node of entities) {
        visit(node)
    }

    return commitOrder
}

function getWeight(edge: RelationMetadata) {
    return edge.isNullable ? 0 : 1
}
