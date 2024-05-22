import {EntityMetadata} from 'typeorm'
import {RelationMetadata} from 'typeorm/metadata/RelationMetadata'

enum State {
    Unvisited,
    Visiting,
    Visited,
}

export function getCommitOrder(entities: EntityMetadata[]): EntityMetadata[] {
    const nodeState: Record<string, State> = {}
    const saveOrder: EntityMetadata[] = []

    for (const node of entities) {
        nodeState[node.name] = State.Unvisited
    }

    function visit(node: EntityMetadata) {
        if (nodeState[node.name] !== State.Unvisited) return

        nodeState[node.name] = State.Visiting

        for (const edge of node.relations) {
            if (edge.foreignKeys.length === 0) continue

            const target = edge.inverseEntityMetadata

            switch (nodeState[target.name]) {
                case undefined:
                case State.Unvisited: {
                    visit(target)
                    break
                }
                case State.Visiting: {
                    const reversedEdge = target.relations.find((r) => r.inverseEntityMetadata === node)
                    if (reversedEdge != null) {
                        const edgeWeight = getWeight(edge)
                        const reversedEdgeWeight = getWeight(reversedEdge)

                        if (edgeWeight > reversedEdgeWeight) {
                            for (const r of target.relations) {
                                visit(r.inverseEntityMetadata)
                            }

                            nodeState[target.name] = State.Visited
                            saveOrder.push(target)
                        }
                    }
                    break
                }
            }
        }

        if (nodeState[node.name] !== State.Visited) {
            nodeState[node.name] = State.Visited
            saveOrder.push(node)
        }
    }

    for (const node of entities) {
        visit(node)
    }

    return saveOrder
}

function getWeight(relation: RelationMetadata) {
    return relation.isNullable ? 0 : 1
}
