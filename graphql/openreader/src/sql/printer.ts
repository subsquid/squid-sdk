import {unexpectedCase} from '@subsquid/util-internal'
import assert from 'assert'
import {Dialect} from '../dialect'
import {OrderBy, SortOrder, SqlArguments, Where} from '../ir/args'
import {FieldRequest, FieldsByEntity} from '../ir/fields'
import {Model} from '../model'
import {getQueryableEntities} from '../model.tools'
import {Cursor, EntityCursor} from './cursor'
import {AliasSet, ColumnSet, escapeIdentifier, JoinSet, printClause} from './util'


export class EntitySqlPrinter {
    private aliases: AliasSet
    private join: JoinSet
    private root: EntityCursor
    private columns = new ColumnSet()
    private where: string[] = []
    private orderBy: string[] = []

    constructor(
        private model: Model,
        private dialect: Dialect,
        public readonly entityName: string,
        private params: unknown[],
        private args: SqlArguments = {},
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
            this.traverseOrderBy(args.orderBy, (field, cursor, order) => {
                this.orderBy.push(cursor.native(field) + ' ' + order)
            })
        }
    }

    private sub(entityName: string, args?: SqlArguments, fields?: FieldRequest[]): EntitySqlPrinter {
        return new EntitySqlPrinter(this.model, this.dialect, entityName, this.params, args, fields, this.aliases)
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
                let f = cursor.prop(where.field).type.kind == 'lookup'
                    ? cursor.child(where.field).ref('id')
                    : cursor.ref(where.field)
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

    traverseOrderBy(orderBy: OrderBy, cb: (field: string, cursor: Cursor, order: SortOrder) => void) {
        this.visitOrderBy(this.root, orderBy, cb)
    }

    private visitOrderBy(cursor: Cursor, orderBy: OrderBy, cb: (field: string, cursor: Cursor, order: SortOrder) => void) {
        for (let field in orderBy) {
            let spec = orderBy[field]
            if (typeof spec == "string") {
                cb(field, cursor, spec)
            } else {
                this.visitOrderBy(cursor.child(field), spec, cb)
            }
        }
    }

    private param(value: any): string {
        if (value && value.__is_squid_big_decimal) {
            return "$" + this.params.push(value.toString()) + '::numeric'
        } else {
            return "$" + this.params.push(value)
        }
    }

    private ident(name: string): string {
        return escapeIdentifier(this.dialect, name)
    }

    private addWhereDerivedFrom(field: string, parentIdExp: string): this {
        this.where.push(`${this.root.native(field)} = ${parentIdExp}`)
        return this
    }

    hasColumns(): boolean {
        return this.columns.size() > 0
    }

    printColumnList(options?: {withAliases?: boolean}): string {
        assert(this.hasColumns())
        let names = this.columns.names()
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

    printAsCount(): string {
        if (this.args.offset || this.args.limit) {
            return `SELECT count(*) FROM (SELECT true ${this.printFrom()}) AS rows`
        } else {
            return `SELECT count(*) ${this.printFrom()}`
        }
    }

    private printAsJsonRows(): string {
        return `SELECT ${this.printColumnListAsJsonArray()} AS row ${this.printFrom()}`
    }
}


export class QueryableSqlPrinter {
    private printers: EntitySqlPrinter[] = []
    private orders: SortOrder[] = []
    private orderColumns: string[][] = []

    constructor(
        private model: Model,
        private dialect: Dialect,
        private queryableName: string,
        private params: unknown[],
        private args: SqlArguments = {},
        fields?: FieldsByEntity
    ) {
        for (let entityName of getQueryableEntities(this.model, this.queryableName)) {
            let entityFields = fields?.[entityName]

            let printer = new EntitySqlPrinter(
                model,
                dialect,
                entityName,
                this.params,
                {where: args.where},
                entityFields
            )

            if (this.args.orderBy) {
                let cols: string[] = []
                this.orders.length = 0
                printer.traverseOrderBy(this.args.orderBy, (field, cursor, order) => {
                    let col = field == '_type' ? `'${entityName}'` : cursor.native(field)
                    this.orders.push(order)
                    cols.push(`${col} AS o${this.orders.length}`)
                })
                this.orderColumns.push(cols)
            }

            this.printers.push(printer)
        }
    }

    print(): string {
        let from = this.printers.map((printer, idx) => {
            let cols: string[] = []
            cols.push(`'${printer.entityName}' AS e`)
            if (printer.hasColumns()) {
                cols.push(printer.printColumnListAsJsonArray() + ' AS d')
            } else {
                cols.push('null AS d')
            }
            cols.push(...this.orderColumns[idx])
            return `SELECT ${cols.join(', ')} ${printer.printFrom()}`
        }).join('\nUNION ALL\n')

        let args = this.printArgs()
        if (args) {
            return `SELECT e, d FROM (\n${from}\n) AS rows` + args
        } else {
            return from
        }
    }

    printAsCount(): string {
        let union = this.orders.length
            ? this.printers.map((printer, idx) => {
                return `SELECT ${this.orderColumns[idx].join(', ')} ${printer.printFrom()}`
            })
            : this.printers.map(printer => {
                return `SELECT true ${printer.printFrom()}`
            })

        let from = union.join('\nUNION ALL\n')
        let args = this.printArgs()
        if (args) {
            from = `SELECT true FROM (\n${from}\n) AS src` + args
        }

        return `SELECT count(*) FROM (\n${from}\n) AS rows`
    }

    private printArgs(): string {
        let sql = ''
        if (this.orders.length) {
            sql += '\nORDER BY ' + this.orders.map((o, idx) => `o${idx + 1} ${o}`).join(', ')
        }
        if (this.args.offset) {
            sql += `\nOFFSET ${this.args.offset}`
        }
        if (this.args.limit) {
            sql += `\nLIMIT ${this.args.limit}`
        }
        return sql
    }
}
