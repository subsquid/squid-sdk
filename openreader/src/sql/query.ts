import {assertNotNull} from '@subsquid/util-internal'
import assert from 'assert'
import type {Dialect} from '../dialect'
import type {SqlArguments, Where} from '../ir/args'
import {
    decodeRelayConnectionCursor,
    encodeRelayConnectionCursor,
    RelayConnectionEdge,
    RelayConnectionPageInfo,
    RelayConnectionRequest,
    RelayConnectionResponse
} from '../ir/connection'
import type {AnyFields, FieldRequest} from '../ir/fields'
import type {Model} from '../model'
import {toSafeInteger} from '../util/util'
import {mapQueryableRows, mapRows} from './mapping'
import {EntitySqlPrinter, QueryableSqlPrinter} from './printer'


export interface Query<T> {
    readonly sql: string
    readonly params: unknown[]
    map(rows: any[][]): T
}


export class ListQuery implements Query<any[]> {
    public readonly sql: string
    public readonly params: unknown[] = []

    constructor(
        model: Model,
        dialect: Dialect,
        typeName: string,
        private fields: AnyFields,
        args: SqlArguments
    ) {
        if (model[typeName].kind == 'entity') {
            assert(Array.isArray(fields))
            this.sql = new EntitySqlPrinter(model, dialect, typeName, this.params, args, fields).print()
        } else {
            assert(!Array.isArray(fields))
            this.sql = new QueryableSqlPrinter(model, dialect, typeName, this.params, args, fields).print()
        }
    }

    map(rows: any[][]): any[] {
        if (Array.isArray(this.fields)) {
            return mapRows(rows, this.fields)
        } else {
            return mapQueryableRows(rows, this.fields)
        }
    }
}


export class EntityByIdQuery {
    public readonly sql: string
    public readonly params: unknown[] = []

    constructor(
        model: Model,
        dialect: Dialect,
        entityName: string,
        private fields: FieldRequest[],
        id: string
    ) {
        this.sql = new EntitySqlPrinter(
            model,
            dialect,
            entityName,
            this.params,
            {where: {op: 'eq', field: 'id', value: id}},
            fields
        ).print()
    }

    map(rows: any[][]): any {
        assert(rows.length < 2)
        return mapRows(rows, this.fields)[0]
    }
}


export class CountQuery implements Query<number> {
    public readonly sql: string
    public readonly params: unknown[] = []

    constructor(
        model: Model,
        dialect: Dialect,
        typeName: string,
        where?: Where
    ) {
        let Printer = model[typeName].kind == 'entity' ? EntitySqlPrinter : QueryableSqlPrinter
        this.sql = new Printer(model, dialect, typeName, this.params, {where}).printAsCount()
    }

    map(rows: any[][]): number {
        return toCount(rows)
    }
}


export class ConnectionQuery implements Query<RelayConnectionResponse> {
    public readonly sql: string
    public readonly params: unknown[] = []
    private offset = 0
    private limit = 100
    private edgeNode?: AnyFields
    private edgeCursor?: boolean
    private pageInfo?: boolean
    private totalCount?: boolean

    constructor(
        model: Model,
        dialect: Dialect,
        typeName: string,
        req: RelayConnectionRequest<AnyFields>
    ) {
        this.setOffsetAndLimit(req)
        this.edgeCursor = req.edgeCursor
        this.pageInfo = req.pageInfo
        this.totalCount = req.totalCount

        let args = {
            orderBy: req.orderBy,
            where: req.where,
            offset: this.offset,
            limit: this.limit + 1
        }

        let printer
        if (model[typeName].kind == 'entity') {
            assert(req.edgeNode == null || Array.isArray(req.edgeNode))
            printer = new EntitySqlPrinter(model, dialect, typeName, this.params, args, req.edgeNode)
        } else {
            assert(req.edgeNode == null || !Array.isArray(req.edgeNode))
            printer = new QueryableSqlPrinter(model, dialect, typeName, this.params, args, req.edgeNode)
        }

        if (req.edgeNode) {
            this.edgeNode = req.edgeNode
            this.sql = printer.print()
        } else {
            this.sql = printer.printAsCount()
        }
    }

    private setOffsetAndLimit(req: RelayConnectionRequest<unknown>): void {
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
            let nodes = Array.isArray(this.edgeNode) ? mapRows(rows, this.edgeNode) : mapQueryableRows(rows, this.edgeNode)
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
            let count = toCount(rows)
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


function toCount(rows: any[][]): number {
    assert(rows.length == 1)
    return toSafeInteger(rows[0][0])
}
