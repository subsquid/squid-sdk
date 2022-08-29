import {BigDecimal} from "@subsquid/big-decimal"
import {unexpectedCase} from "@subsquid/util-internal"
import assert from "assert"
import {Dialect} from "../dialect"
import {EntityListArguments, OrderBy, Where} from "../ir/args"
import {FieldRequest} from "../ir/fields"
import {Model} from "../model"
import {Cursor, EntityCursor} from "./cursor"
import {AliasSet, ColumnSet, escapeIdentifier, JoinSet, printClause} from "./util"


export class EntityListQueryPrinter {
    private aliases: AliasSet
    private join: JoinSet
    private root: EntityCursor
    private columns = new ColumnSet()
    private where: string[] = []
    private orderBy: string[] = []

    constructor(
        private model: Model,
        private dialect: Dialect,
        private entityName: string,
        private params: unknown[],
        private args: EntityListArguments = {},
        fields?: FieldRequest[],
        aliases?: AliasSet
    ) {
        this.aliases = aliases || new AliasSet()
        this.join = new JoinSet(this.aliases)
        this.root = new EntityCursor(
            {
                model: this.model,
                dialect: this.dialect,
                aliases: this.aliases,
                join: this.join
            },
            this.entityName
        )
        if (fields?.length) {
            this.populateColumns(this.root, fields)
        }
        if (args.where) {
            this.populateWhere(this.root, args.where, this.where)
        }
        if (args.orderBy) {
            this.populateOrderBy(this.root, args.orderBy)
        }
    }

    private sub(entityName: string, args?: EntityListArguments, fields?: FieldRequest[]): EntityListQueryPrinter {
        return new EntityListQueryPrinter(this.model, this.dialect, entityName, this.params, args, fields, this.aliases)
    }

    private populateColumns(cursor: Cursor, fields: FieldRequest[]): void {
        for (let f of fields) {
            switch(f.kind) {
                case "scalar":
                case "enum":
                case "list":
                    f.index = this.columns.add(cursor.output(f.field))
                    break
                case "object":
                    f.index = this.columns.add(cursor.ref(f.field) + " IS NULL")
                    this.populateColumns(cursor.child(f.field), f.children)
                    break
                case "union": {
                    let c = cursor.child(f.field)
                    f.index = this.columns.add(c.output("isTypeOf"))
                    this.populateColumns(c, f.children)
                    break
                }
                case "fk":
                case "lookup": {
                    let c = cursor.child(f.field)
                    f.index = this.columns.add(c.output("id"))
                    this.populateColumns(c, f.children)
                    break
                }
                case "list-lookup": {
                    let sub = this.sub(f.type.entity, f.args, f.children).addWhereDerivedFrom(f.type.field, cursor.native("id"))
                    let exp = `(SELECT jsonb_agg(row) FROM (${sub.printAsJsonRows()}) AS rows)`
                    f.index = this.columns.add(exp)
                    break
                }
                default:
                    throw unexpectedCase()
            }
        }
    }

    private populateWhere(cursor: Cursor, where: Where, exps: string[]): void {
        switch(where.op) {
            case "AND":
                for (let cond of where.args) {
                    this.populateWhere(cursor, cond, exps)
                }
                break
            case "OR": {
                let or: string[] = []
                for (let cond of where.args) {
                    let exp = this.printWhere(cursor, cond)
                    if (exp) {
                        or.push("(" + exp + ")")
                    }
                }
                if (or.length > 0) {
                    exps.push("(" + printClause("OR", or) + ")")
                }
                break
            }
            case "REF":
                this.populateWhere(cursor.child(where.field), where.where, exps)
                break
            case "in": {
                let args = where.values.map(v => this.param(v))
                if (args.length > 0) {
                    exps.push(`${cursor.native(where.field)} IN (${args.join(", ")})`)
                } else {
                    exps.push("false")
                }
                break
            }
            case "not_in": {
                let args = where.values.map(v => this.param(v))
                if (args.length > 0) {
                    exps.push(`${cursor.native(where.field)} NOT IN (${args.join(", ")})`)
                }
                break
            }
            case "isNull": {
                let f = cursor.ref(where.field)
                if (where.yes) {
                    exps.push(`${f} IS NULL`)
                } else {
                    exps.push(`${f} IS NOT NULL`)
                }
                break
            }
            case "eq":
                this.scalarBinaryCondition("=", cursor, where, exps)
                break
            case "not_eq":
                this.scalarBinaryCondition("!=", cursor, where, exps)
                break
            case "gt":
                this.scalarBinaryCondition(">", cursor, where, exps)
                break
            case "gte":
                this.scalarBinaryCondition(">=", cursor, where, exps)
                break
            case "lt":
                this.scalarBinaryCondition("<", cursor, where, exps)
                break
            case "lte":
                this.scalarBinaryCondition("<=", cursor, where, exps)
                break
            case "jsonContains":
                this.scalarBinaryCondition("@>", cursor, where, exps)
                break
            case "jsonHasKey":
                this.scalarBinaryCondition("?", cursor, where, exps)
                break
            case "containsAll":
                this.refBinaryCondition("@>", cursor, where, exps)
                break
            case "containsAny":
                this.refBinaryCondition("&&", cursor, where, exps)
                break
            case "containsNone": {
                let lhs = cursor.ref(where.field)
                let rhs = this.param(where.value)
                exps.push(`NOT (${lhs} && ${rhs})`)
                break
            }
            case "startsWith":
                if (this.dialect == "cockroach") {
                    let f = cursor.native(where.field)
                    let p = this.param(where.value) + "::text"
                    exps.push(`${f} >= ${p}`)
                    exps.push(`left(${f}, length(${p})) = ${p}`)
                } else {
                    exps.push(`starts_with(${cursor.native(where.field)}, ${this.param(where.value)})`)
                }
                break
            case "not_startsWith":
                if (this.dialect == "cockroach") {
                    let f = cursor.native(where.field)
                    let p = this.param(where.value) + "::text"
                    exps.push(`(${f} < ${p} OR left(${f}, length(${p})) != ${p})`)
                } else {
                    exps.push(`NOT starts_with(${cursor.native(where.field)}, ${this.param(where.value)})`)
                }
                break
            case "endsWith": {
                let f = cursor.native(where.field)
                let p = this.param(where.value) + "::text"
                exps.push(`right(${f}, length(${p})) = ${p}`)
                break
            }
            case "not_endsWith": {
                let f = cursor.native(where.field)
                let p = this.param(where.value) + "::text"
                exps.push(`right(${f}, length(${p})) != ${p}`)
                break
            }
            case "contains":
                exps.push(`position(${this.param(where.value)} in ${cursor.native(where.field)}) > 0`)
                break
            case "not_contains":
                exps.push(`position(${this.param(where.value)} in ${cursor.native(where.field)}) = 0`)
                break
            case "containsInsensitive":
                exps.push(`position(lower(${this.param(where.value)}) in lower(${cursor.native(where.field)})) > 0`)
                break
            case "not_containsInsensitive":
                exps.push(`position(lower(${this.param(where.value)}) in lower(${cursor.native(where.field)})) = 0`)
                break
            case "every": {
                let rel = cursor.prop(where.field)
                assert(rel.type.kind == "list-lookup")
                let cond = this.sub(rel.type.entity, {where: where.where}).addWhereDerivedFrom(rel.type.field, cursor.native("id"))
                let all = this.sub(rel.type.entity).addWhereDerivedFrom(rel.type.field, cursor.native("id"))
                exps.push(`(SELECT count(*) ${cond.printFrom()}) = (SELECT count(*) ${all.printFrom()})`)
                break
            }
            case "some":
            case "none": {
                let rel = cursor.prop(where.field)
                assert(rel.type.kind == "list-lookup")
                let sub = this.sub(rel.type.entity, {
                    where: where.where,
                    limit: 1
                }).addWhereDerivedFrom(rel.type.field, cursor.native("id"))
                if (where.op == "some") {
                    exps.push(`(SELECT true ${sub.printFrom()})`)
                } else {
                    exps.push(`(SELECT count(*) FROM (SELECT true ${sub.printFrom()}) AS rows) = 0`)
                }
                break
            }
            default:
                throw unexpectedCase((where as any).op)
        }
    }

    private scalarBinaryCondition(sqlOp: string, cursor: Cursor, where: {field: string, value: unknown}, exps: string[]): void {
        let f = cursor.native(where.field)
        let p = this.param(where.value)
        exps.push(`${f} ${sqlOp} ${p}`)
    }

    private refBinaryCondition(sqlOp: string, cursor: Cursor, where: {field: string, value: unknown}, exps: string[]): void {
        let f = cursor.ref(where.field)
        let p = this.param(where.value)
        exps.push(`${f} ${sqlOp} ${p}`)
    }

    private printWhere(cursor: Cursor, where: Where): string {
        let exps: string[] = []
        this.populateWhere(cursor, where, exps)
        return printClause("AND", exps)
    }

    private populateOrderBy(cursor: Cursor, orderBy: OrderBy): void {
        for (let field in orderBy) {
            let spec = orderBy[field]
            if (typeof spec == "string") {
                this.orderBy.push(`${cursor.native(field)} ${spec}`)
            } else {
                this.populateOrderBy(cursor.child(field), spec)
            }
        }
    }

    private param(value: any): string {
        if (value instanceof BigDecimal) {
            return "$" + this.params.push(value.toString()) + '::numeric'
        } else {
            return "$" + this.params.push(value)
        }
    }

    private ident(name: string): string {
        return escapeIdentifier(this.dialect, name)
    }

    addWhereDerivedFrom(field: string, parentIdExp: string): this {
        this.where.push(`${this.root.native(field)} = ${parentIdExp}`)
        return this
    }

    printColumnList(options?: {withAliases?: boolean}): string {
        let names = this.columns.names()
        assert(names.length > 0)
        if (options?.withAliases) {
            names = names.map((name, idx) => `${name} AS _c${idx}`)
        }
        return names.join(', ')
    }

    printColumnListAsJsonArray(): string {
        return `json_build_array(${this.printColumnList()})`
    }

    printFrom(): string {
        let out = `FROM ${this.ident(this.root.table)} AS ${this.ident(this.root.tableAlias)}`
        this.join.forEach(j => {
            out += ` LEFT OUTER JOIN ${this.ident(j.table)} ${this.ident(j.alias)} ON ${this.ident(j.alias)}.${this.ident(j.column)} = ${j.rhs}`
        })
        if (this.where.length > 0) {
            out += ` WHERE ${printClause("AND", this.where)}`
        }
        if (this.orderBy.length > 0) {
            out += " ORDER BY " + this.orderBy.join(", ")
        }
        if (this.args.limit != null) {
            out += ` LIMIT ${this.args.limit}`
        }
        if (this.args.offset) {
            out += ` OFFSET ${this.args.offset}`
        }
        return out
    }

    print(): string {
        return `SELECT ${this.printColumnList({withAliases: true})} ${this.printFrom()}`
    }

    printAsJsonRows(): string {
        return `SELECT ${this.printColumnListAsJsonArray()} AS row ${this.printFrom()}`
    }
}
