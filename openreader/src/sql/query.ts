import {assertNotNull} from "@subsquid/util-internal"
import assert from "assert"
import type {Dialect} from "../dialect"
import type {EntityListArguments, Where} from "../ir/args"
import {
    decodeRelayConnectionCursor,
    encodeRelayConnectionCursor,
    RelayConnectionEdge,
    RelayConnectionPageInfo,
    RelayConnectionRequest,
    RelayConnectionResponse
} from "../ir/connection"
import type {FieldRequest} from "../ir/fields"
import type {Model} from "../model"
import {toSafeInteger} from "../util/util"
import {mapRows} from "./mapping"
import {EntityListQueryPrinter} from "./printer"
import {AliasSet} from "./util"


export interface Query<T> {
    readonly sql: string
    readonly params: unknown[]
    map(rows: any[][]): T
}


export class EntityListQuery implements Query<any[]> {
    public readonly sql: string
    public readonly params: unknown[] = []

    constructor(
        model: Model,
        dialect: Dialect,
        entityName: string,
        private fields: FieldRequest[],
        args: EntityListArguments
    ) {
        this.sql = new EntityListQueryPrinter(
            model,
            dialect,
            this.params,
            new AliasSet(),
            entityName,
            args,
            fields
        ).print()
    }

    map(rows: any[][]): any[] {
        return mapRows(rows, this.fields)
    }
}


export class EntityCountQuery implements Query<number> {
    public readonly sql: string
    public readonly params: unknown[] = []

    constructor(
        model: Model,
        dialect: Dialect,
        entityName: string,
        where?: Where
    ) {
        this.sql = 'SELECT count(*) ' + new EntityListQueryPrinter(
            model,
            dialect,
            this.params,
            new AliasSet(),
            entityName,
            {where},
        ).printFrom()
    }

    map(rows: any[][]): number {
        assert(rows.length == 1)
        return toSafeInteger(rows[0][0])
    }
}


export class EntityConnectionQuery implements Query<RelayConnectionResponse> {
    public readonly sql: string
    public readonly params: unknown[] = []
    private offset = 0
    private limit = 100
    private edgeNode?: FieldRequest[]
    private edgeCursor?: boolean
    private pageInfo?: boolean
    private totalCount?: boolean

    constructor(
        model: Model,
        dialect: Dialect,
        entityName: string,
        req: RelayConnectionRequest
    ) {
        this.setOffsetAndLimit(req)
        this.edgeCursor = req.edgeCursor
        this.pageInfo = req.pageInfo
        this.totalCount = req.totalCount

        let printer = new EntityListQueryPrinter(
            model,
            dialect,
            this.params,
            new AliasSet(),
            entityName,
            {orderBy: req.orderBy, where: req.where, offset: this.offset, limit: this.limit + 1},
            req.edgeNode
        )

        if (req.edgeNode?.length) {
            this.edgeNode = req.edgeNode
            this.sql = printer.print()
        } else {
            this.sql = `SELECT count(*) FROM (SELECT true ${printer.printFrom()}) AS rows`
        }
    }

    private setOffsetAndLimit(req: RelayConnectionRequest): void {
        if (req.after != null) {
            this.offset = assertNotNull(decodeRelayConnectionCursor(req.after))
        }
        if (req.first != null) {
            assert(req.first >= 0)
            this.limit = req.first
        }
    }

    map(rows: any[][]): RelayConnectionResponse {
        let res: RelayConnectionResponse = {}
        if (this.edgeNode) {
            let nodes = mapRows(rows, this.edgeNode)
            let edges: RelayConnectionEdge[] = new Array(Math.min(this.limit, nodes.length))
            for (let i = 0; i < edges.length; i++) {
                edges[i] = {
                    node: nodes[i],
                    cursor: this.edgeCursor ? encodeRelayConnectionCursor(this.offset + i + 1) : undefined
                }
            }
            res.edges = edges
            res.pageInfo = this.getPageInfo(nodes.length)
            res.totalCount = this.getTotalCount(nodes.length)
        } else {
            assert(rows.length == 1)
            let count = toSafeInteger(rows[0][0])
            if (this.edgeCursor) {
                res.edges = new Array(Math.min(this.limit, count))
                for (let i = 0; i < res.edges.length; i++) {
                    res.edges[i] = {
                        cursor: encodeRelayConnectionCursor(this.offset + i + 1)
                    }
                }
            }
            res.pageInfo = this.getPageInfo(count)
            res.totalCount = this.getTotalCount(count)
        }
        return res
    }

    private getPageInfo(count: number): Partial<RelayConnectionPageInfo> | undefined {
        if (!this.pageInfo) return
        return {
            hasNextPage: count > this.limit,
            hasPreviousPage: count > 0 && this.offset > 0,
            startCursor: count > 0 ? encodeRelayConnectionCursor(this.offset + 1) : '',
            endCursor: count > 0 ? encodeRelayConnectionCursor(this.offset + Math.min(this.limit, count)) : ''
        }
    }

    private getTotalCount(count: number): number | undefined {
        if (!this.totalCount) return
        if (count > 0 && count <= this.limit) {
            return this.offset + count
        } else {
            return undefined
        }
    }
}
