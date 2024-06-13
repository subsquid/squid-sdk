import {DataSource, EntityMetadata} from 'typeorm'
import {RelationMetadata} from 'typeorm/metadata/RelationMetadata'

enum NodeState {
    Unvisited,
    Visiting,
    Visited,
}

const COMMIT_ORDERS: WeakMap<DataSource, EntityMetadata[]> = new WeakMap()

export function sortMetadatasInCommitOrder(connection: DataSource): EntityMetadata[] {
    let commitOrder = COMMIT_ORDERS.get(connection)
    if (commitOrder != null) return commitOrder

    let states: Map<string, NodeState> = new Map()

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
                        commitOrder?.push(target)
                    }
                }
            }
        }

        let nodeState = states.get(node.name)

        if (nodeState !== NodeState.Visited) {
            states.set(node.name, NodeState.Visited)
            commitOrder?.push(node)
        }
    }

    commitOrder = []

    for (let node of connection.entityMetadatas) {
        if (!states.has(node.name)) {
            states.set(node.name, NodeState.Unvisited)
        }

        visit(node)
    }

    COMMIT_ORDERS.set(connection, commitOrder)

    return commitOrder
}

function getWeight(edge: RelationMetadata) {
    return edge.isNullable ? 0 : 1
}
