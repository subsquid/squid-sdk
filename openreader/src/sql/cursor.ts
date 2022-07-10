import {unexpectedCase} from "@subsquid/util-internal"
import {toSnakeCase} from "@subsquid/util-naming"
import assert from "assert"
import {Dialect} from "../dialect"
import {Entity, JsonObject, Model} from "../model"
import {getEntity, getFtsQuery, getObject, getUnionProps} from "../model.tools"
import {toColumn, toFkColumn, toTable} from "../util"
import {AliasSet, escapeIdentifier, JoinSet} from "./util"


export interface QueryCtx {
    model: Model
    dialect: Dialect
    aliases: AliasSet
    join: JoinSet
}


export type Cursor = EntityCursor | ObjectCursor


export class EntityCursor {
    public readonly entity: Entity
    public readonly table: string
    public readonly tableAlias: string

    constructor(
        private ctx: QueryCtx,
        private entityName: string,
        joined?: {on: string, rhs: string}
    ) {
        this.entity = getEntity(this.ctx.model, this.entityName)
        this.table = this.ident(toTable(this.entityName))
        if (joined) {
            this.tableAlias = this.ctx.join.add(this.table, this.ident(joined.on), joined.rhs)
        } else {
            this.tableAlias = this.ident(this.ctx.aliases.add(this.table))
        }
    }

    private ident(name: string): string {
        return escapeIdentifier(this.ctx.dialect, name)
    }

    private column(field: string) {
        return this.tableAlias + "." + this.ident(toColumn(field))
    }

    output(field: string): string {
        let col = this.column(field)
        let prop = this.entity.properties[field]
        switch(prop.type.kind) {
            case "scalar":
                switch(prop.type.name) {
                    case "BigInt":
                        return `(${col})::text`
                    case "Bytes":
                        return `'0x' || encode(${col}, 'hex')`
                    case "DateTime":
                        if (this.ctx.dialect == "cockroach") {
                            return `experimental_strftime((${col}) at time zone 'UTC', '%Y-%m-%dT%H:%M:%S.%fZ')`
                        } else {
                            return `to_char((${col}) at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`
                        }
                    default:
                        return col
                }
            case "enum":
                return col
            case "list": {
                let itemType = prop.type.item.type
                switch(itemType.kind) {
                    case "scalar":
                    case "enum":
                        switch(itemType.name) {
                            case "BigInt":
                                return `(${col})::text[]`
                            case "Bytes":
                                return `array(select '0x' || encode(i, 'hex') from unnest(${col}) as i)`
                            case "DateTime":
                                if (this.ctx.dialect == "cockroach") {
                                    return `array(select experimental_strftime(i at time zone 'UTC', '%Y-%m-%dT%H:%M:%S.%fZ') from unnest(${col}) as i)`
                                } else {
                                    return `array(select to_char(i at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') from unnest(${col}) as i)`
                                }
                            default:
                                return col
                        }
                    default:
                        return col
                }
            }
            default:
                throw unexpectedCase(prop.type.kind)
        }
    }

    native(field: string): string {
        return this.column(field)
    }

    fk(field: string): string {
        assert(this.entity.properties[field]?.type.kind == 'fk')
        return this.tableAlias + "." + this.ident(toFkColumn(field))
    }

    child(field: string): Cursor {
        let prop = this.entity.properties[field]
        switch(prop.type.kind) {
            case "object":
                return new ObjectCursor(
                    this.ctx,
                    getObject(this.ctx.model, prop.type.name),
                    this.column(field)
                )
            case "union":
                return new ObjectCursor(
                    this.ctx,
                    getUnionProps(this.ctx.model, prop.type.name),
                    this.column(field)
                )
            case "fk":
                return new EntityCursor(
                    this.ctx,
                    prop.type.foreignEntity,
                    {on: 'id', rhs: this.fk(field)}
                )
            case "lookup":
                return new EntityCursor(
                    this.ctx,
                    prop.type.entity,
                    {on: prop.type.field, rhs: this.column('id')}
                )
            default:
                throw unexpectedCase(prop.type.kind)
        }
    }

    tsv(queryName: string): string {
        return this.tableAlias + "." + this.ident(toSnakeCase(queryName) + "_tsv")
    }

    doc(queryName: string): string {
        let query = getFtsQuery(this.ctx.model, queryName)
        let src = query.sources.find(src => src.entity == this.entityName)
        assert(src != null)
        return src.fields.map(f => `coalesce(${this.column(f)}, '')`).join(` || E'\\n\\n' || `)
    }
}


export class ObjectCursor {
    constructor(
        private ctx: QueryCtx,
        private object: JsonObject,
        private prefix: string
    ) {
    }

    private json(field: string): string {
        return `${this.prefix}->'${field}'`
    }

    private string(field: string): string {
        return `${this.prefix}->>'${field}'`
    }

    output(field: string): string {
        let prop = this.object.properties[field]
        switch(prop.type.kind) {
            case "scalar":
                switch(prop.type.name) {
                    case 'Int':
                        return `(${this.json(field)})::integer`
                    case 'Float':
                        return `(${this.json(field)})::numeric`
                    case 'Boolean':
                        return `(${this.string(field)})::bool`
                    case 'JSON':
                        return this.json(field)
                    default:
                        return this.string(field)
                }
            case "enum":
                return this.string(field)
            case "list":
                return this.json(field)
            default:
                throw unexpectedCase(prop.type.kind)
        }
    }

    native(field: string): string {
        let prop = this.object.properties[field]
        assert(prop.type.kind == 'scalar' || prop.type.kind == 'enum')
        switch(prop.type.name) {
            case 'Int':
                return `(${this.json(field)})::integer`
            case 'Float':
                return `(${this.json(field)})::numeric`
            case 'Boolean':
                return `(${this.string(field)})::bool`
            case 'BigInt':
                return `(${this.string(field)})::numeric`
            case 'Bytes':
                return `decode(substr(${this.string(field)}, 3), 'hex')`
            case 'DateTime':
                return `(${this.string(field)})::timestamptz`
            default:
                return this.string(field)
        }
    }

    fk(field: string): string {
        assert(this.object.properties[field]?.type.kind == 'fk')
        return this.string(field)
    }

    child(field: string): Cursor {
        let prop = this.object.properties[field]
        switch(prop.type.kind) {
            case "object":
                return new ObjectCursor(
                    this.ctx,
                    getObject(this.ctx.model, prop.type.name),
                    this.json(field)
                )
            case "union":
                return new ObjectCursor(
                    this.ctx,
                    getUnionProps(this.ctx.model, prop.type.name),
                    this.json(field)
                )
            case "fk":
                return new EntityCursor(
                    this.ctx,
                    prop.type.foreignEntity,
                    {on: 'id', rhs: this.string(field)}
                )
            default:
                throw unexpectedCase(prop.type.kind)
        }
    }
}

