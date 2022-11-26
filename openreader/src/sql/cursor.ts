import {assertNotNull, unexpectedCase} from "@subsquid/util-internal"
import {toSnakeCase} from "@subsquid/util-naming"
import assert from "assert"
import {Dialect} from "../dialect"
import {Entity, JsonObject, Model, ObjectPropType, Prop, UnionPropType} from "../model"
import {getEntity, getFtsQuery, getObject, getUnionProps} from "../model.tools"
import {toColumn, toFkColumn, toTable} from "../util/util"
import {AliasSet, escapeIdentifier, JoinSet} from "./util"


export interface CursorCtx {
    model: Model
    dialect: Dialect
    aliases: AliasSet
    join: JoinSet
}


export interface Cursor {
    output(field: string): string
    native(field: string): string
    ref(field: string): string
    child(field: string): Cursor
    prop(field: string): Prop
}


export class EntityCursor implements Cursor {
    public readonly entity: Entity
    public readonly table: string
    public readonly tableAlias: string

    constructor(
        private ctx: CursorCtx,
        private entityName: string,
        joined?: {on: string, rhs: string}
    ) {
        this.entity = getEntity(this.ctx.model, this.entityName)
        this.table = toTable(this.entityName)
        if (joined) {
            this.tableAlias = this.ctx.join.add(this.table, this._columnName(joined.on), joined.rhs)
        } else {
            this.tableAlias = this.ctx.aliases.add(this.table)
        }
    }

    private ident(name: string): string {
        return escapeIdentifier(this.ctx.dialect, name)
    }

    private column(field: string): string {
        return this.ident(this.tableAlias) + "." + this.ident(this._columnName(field))
    }

    private _columnName(field: string): string {
        let prop = this.prop(field)
        if (prop.type.kind == 'fk') {
            return toFkColumn(field)
        } else {
            return toColumn(field)
        }
    }

    prop(field: string): Prop {
        return assertNotNull(this.entity.properties[field])
    }

    output(field: string): string {
        let col = this.column(field)
        let prop = this.prop(field)
        switch(prop.type.kind) {
            case "scalar":
                switch(prop.type.name) {
                    case "BigInt":
                    case "BigDecimal":
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
                        switch(itemType.name) {
                            case "BigInt":
                            case "BigDecimal":
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
        let prop = this.prop(field)
        switch(prop.type.kind) {
            case "fk":
            case "scalar":
            case "enum":
                return this.column(field)
            default:
                throw unexpectedCase(prop.type.kind)
        }
    }

    ref(field: string): string {
        let prop = this.prop(field)
        switch(prop.type.kind) {
            case "fk":
            case "scalar":
            case "enum":
            case "union":
            case "object":
            case "list":
                return this.column(field)
            default:
                throw unexpectedCase(prop.type.kind)
        }
    }

    child(field: string): Cursor {
        let prop = this.entity.properties[field]
        switch(prop.type.kind) {
            case "object":
            case "union":
                return new ObjectCursor(
                    this.ctx,
                    this.column(field),
                    prop.type
                )
            case "fk":
                return new EntityCursor(
                    this.ctx,
                    prop.type.entity,
                    {on: 'id', rhs: this.native(field)}
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
        return this.ident(this.tableAlias) + "." + this.ident(toSnakeCase(queryName) + "_tsv")
    }

    doc(queryName: string): string {
        let query = getFtsQuery(this.ctx.model, queryName)
        let src = query.sources.find(src => src.entity == this.entityName)
        assert(src != null)
        return src.fields.map(f => `coalesce(${this.column(f)}, '')`).join(` || E'\\n\\n' || `)
    }
}


export class ObjectCursor implements Cursor {
    private object: JsonObject
    public readonly isUnion: boolean

    constructor(
        private ctx: CursorCtx,
        private prefix: string,
        type: ObjectPropType | UnionPropType
    ) {
        if (type.kind == 'union') {
            this.isUnion = true
            this.object = getUnionProps(this.ctx.model, type.name)
        } else {
            this.isUnion = false
            this.object = getObject(this.ctx.model, type.name)
        }
    }

    private json(field: string): string {
        return `${this.prefix}->'${field}'`
    }

    private string(field: string): string {
        return `${this.prefix}->>'${field}'`
    }

    prop(field: string): Prop {
        return assertNotNull(this.object.properties[field])
    }

    output(field: string): string {
        let prop = this.prop(field)
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
        let prop = this.prop(field)
        switch(prop.type.kind) {
            case "fk":
            case "enum":
                return this.string(field)
            case "scalar":
                switch(prop.type.name) {
                    case 'Int':
                        return `(${this.json(field)})::integer`
                    case 'Float':
                        return `(${this.json(field)})::numeric`
                    case 'Boolean':
                        return `(${this.string(field)})::bool`
                    case 'BigInt':
                        return `(${this.string(field)})::numeric`
                    case 'BigDecimal':
                        return `(${this.string(field)})::numeric`
                    case 'Bytes':
                        return `decode(substr(${this.string(field)}, 3), 'hex')`
                    case 'DateTime':
                        return `(${this.string(field)})::timestamptz`
                    default:
                        return this.string(field)
                }
            default:
                throw unexpectedCase(prop.type.kind)
        }
    }

    ref(field: string): string {
        return this.json(field)
    }

    child(field: string): Cursor {
        let prop = this.prop(field)
        switch(prop.type.kind) {
            case "object":
            case "union":
                return new ObjectCursor(
                    this.ctx,
                    this.json(field),
                    prop.type
                )
            case "fk":
                return new EntityCursor(
                    this.ctx,
                    prop.type.entity,
                    {on: 'id', rhs: this.string(field)}
                )
            default:
                throw unexpectedCase(prop.type.kind)
        }
    }
}
