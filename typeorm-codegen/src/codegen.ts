import type {Entity, Enum, JsonObject, Model, Prop, Union} from '@subsquid/openreader/lib/model'
import {unexpectedCase} from '@subsquid/util-internal'
import {OutDir, Output} from '@subsquid/util-internal-code-printer'
import {toCamelCase} from '@subsquid/util-naming'
import assert from 'assert'
import * as path from 'path'


export function generateOrmModels(model: Model, dir: OutDir): void {
    const variants = collectVariants(model)
    const index = dir.file('index.ts')

    for (const name in model) {
        const item = model[name]
        switch(item.kind) {
            case 'entity':
                generateEntity(name, item)
                break
            case 'object':
                generateObject(name, item)
                break
            case 'union':
                generateUnion(name, item)
                break
            case 'enum':
                generateEnum(name, item)
                break
        }
    }

    index.write()
    dir.add('marshal.ts', path.resolve(__dirname, '../src/marshal.ts'))

    function generateEntity(name: string, entity: Entity): void {
        index.line(`export * from "./${toCamelCase(name)}.model"`)
        const out = dir.file(`${toCamelCase(name)}.model.ts`)
        const imports = new ImportRegistry(name)
        imports.useTypeorm('Entity', 'Column', 'PrimaryColumn')
        out.lazy(() => imports.render(model, out))
        out.line()
        printComment(entity, out)
        entity.indexes?.forEach(index => {
            if (index.fields.length < 2) return
            out.line(`@Index_([${index.fields.map(f => `"${f.name}"`).join(', ')}], {unique: ${!!index.unique}})`)
        })
        out.line('@Entity_()')
        out.block(`export class ${name}`, () => {
            out.block(`constructor(props?: Partial<${name}>)`, () => {
                out.line('Object.assign(this, props)')
            })
            for (const key in entity.properties) {
                const prop = entity.properties[key]
                importReferencedModel(imports, prop)
                out.line()
                printComment(prop, out)
                switch(prop.type.kind) {
                    case 'scalar':
                        if (key === 'id') {
                            out.line('@PrimaryColumn_()')
                        } else {
                            addIndexAnnotation(entity, key, imports, out)
                            switch (prop.type.name) {
                                case 'BigInt':
                                    imports.useMarshal()
                                    out.line(
                                        `@Column_("${getDbType(prop.type.name)}", {transformer: marshal.bigintTransformer, nullable: ${prop.nullable}})`
                                    )
                                    break
                                case 'BigDecimal':
                                    imports.useMarshal()
                                    out.line(
                                        `@Column_("${getDbType(prop.type.name)}", {transformer: marshal.bigdecimalTransformer, nullable: ${prop.nullable}})`
                                    )
                                    break
                                case 'Float':
                                    imports.useMarshal()
                                    out.line(
                                        `@Column_("${getDbType(prop.type.name)}", {transformer: marshal.floatTransformer, nullable: ${prop.nullable}})`
                                    )
                                    break
                                default:
                                    out.line(
                                        `@Column_("${getDbType(prop.type.name)}", {nullable: ${
                                            prop.nullable
                                        }})`
                                    )
                                    break
                            }
                        }
                        break
                    case 'enum':
                        addIndexAnnotation(entity, key, imports, out)
                        out.line(
                            `@Column_("varchar", {length: ${getEnumMaxLength(
                                model,
                                prop.type.name
                            )}, nullable: ${prop.nullable}})`
                        )
                        break
                    case 'fk':
                        if (getFieldIndex(entity, key)?.unique) {
                            imports.useTypeorm('OneToOne', 'Index', 'JoinColumn')
                            out.line(`@Index_({unique: true})`)
                            out.line(
                                `@OneToOne_(() => ${prop.type.entity}, {nullable: false})`
                            )
                            out.line(`@JoinColumn_()`)
                        } else {
                            imports.useTypeorm('ManyToOne', 'Index')
                            if (!entity.indexes?.some(index => index.fields[0]?.name == key && index.fields.length > 1)) {
                                out.line(`@Index_()`)
                            }
                            // Make foreign entity references always nullable
                            out.line(
                                `@ManyToOne_(() => ${prop.type.entity}, {nullable: true})`
                            )
                        }
                        break
                    case 'lookup':
                        imports.useTypeorm('OneToOne')
                        out.line(`@OneToOne_(() => ${prop.type.entity})`)
                        break
                    case 'list-lookup':
                        imports.useTypeorm('OneToMany')
                        out.line(
                            `@OneToMany_(() => ${prop.type.entity}, e => e.${prop.type.field})`
                        )
                        break
                    case 'object':
                    case 'union':
                        imports.useMarshal()
                        out.line(
                            `@Column_("jsonb", {transformer: {to: obj => ${marshalToJson(
                                prop,
                                'obj'
                            )}, from: obj => ${marshalFromJson({...prop, nullable: true}, 'obj')}}, nullable: ${
                                prop.nullable
                            }})`
                        )
                        break
                    case 'list':
                        switch(prop.type.item.type.kind) {
                            case 'scalar': {
                                let scalar = prop.type.item.type.name
                                if (scalar == 'BigInt' || scalar == 'BigDecimal') {
                                    throw new Error(`Property ${name}.${key} has unsupported type: can't generate code for native ${scalar} arrays.`)
                                }
                                out.line(
                                    `@Column_("${getDbType(scalar)}", {array: true, nullable: ${prop.nullable}})`
                                )
                                break
                            }
                            case 'enum':
                                out.line(
                                    `@Column_("varchar", {length: ${getEnumMaxLength(
                                        model,
                                        prop.type.item.type.name
                                    )}, array: true, nullable: ${prop.nullable}})`
                                )
                                break
                            case 'object':
                            case 'union':
                            case 'list':
                                imports.useMarshal()
                                out.line(
                                    `@Column_("jsonb", {transformer: {to: obj => ${marshalToJson(
                                        prop,
                                        'obj'
                                    )}, from: obj => ${marshalFromJson(
                                        {...prop, nullable: true},
                                        'obj'
                                    )}}, nullable: ${prop.nullable}})`
                                )
                                break
                            default:
                                throw unexpectedCase(prop.type.item.type.kind)
                        }
                        break
                    default:
                        throw unexpectedCase((prop.type as any).kind)
                }
                out.line(`${key}!: ${getPropJsType(imports, 'entity', prop)}`)
            }
        })
        out.write()
    }

    function getDbType(scalar: string): string {
        switch(scalar) {
            case 'ID':
            case 'String':
                return 'text'
            case 'Int':
                return 'int4'
            case 'Float':
                return 'numeric'
            case 'Boolean':
                return 'bool'
            case 'DateTime':
                return 'timestamp with time zone'
            case 'BigInt':
            case 'BigDecimal':
                return 'numeric'
            case 'Bytes':
                return 'bytea'
            case 'JSON':
                return 'jsonb'
            default:
                throw unexpectedCase(scalar)
        }
    }

    function generateObject(name: string, object: JsonObject): void {
        index.line(`export * from "./_${toCamelCase(name)}"`)
        const out = dir.file(`_${toCamelCase(name)}.ts`)
        const imports = new ImportRegistry(name)
        imports.useMarshal()
        imports.useAssert()
        out.lazy(() => imports.render(model, out))
        out.line()
        printComment(object, out)
        out.block(`export class ${name}`, () => {
            if (variants.has(name)) {
                out.line(`public readonly isTypeOf = '${name}'`)
            }
            for (const key in object.properties) {
                const prop = object.properties[key]
                importReferencedModel(imports, prop)
                out.line(`private _${key}!: ${getPropJsType(imports, 'object', prop)}`)
            }
            out.line()
            out.block(
                `constructor(props?: Partial<Omit<${name}, 'toJSON'>>, json?: any)`,
                () => {
                    out.line('Object.assign(this, props)')
                    out.block(`if (json != null)`, () => {
                        for (const key in object.properties) {
                            const prop = object.properties[key]
                            out.line(`this._${key} = ${marshalFromJson(prop, 'json.' + key)}`)
                        }
                    })
                }
            )
            for (const key in object.properties) {
                const prop = object.properties[key]
                out.line()
                printComment(prop, out)
                out.block(`get ${key}(): ${getPropJsType(imports, 'object', prop)}`, () => {
                    if (!prop.nullable) {
                        out.line(`assert(this._${key} != null, 'uninitialized access')`)
                    }
                    out.line(`return this._${key}`)
                })
                out.line()
                out.block(`set ${key}(value: ${getPropJsType(imports, 'object', prop)})`, () => {
                    out.line(`this._${key} = value`)
                })
            }
            out.line()
            out.block(`toJSON(): object`, () => {
                out.block('return', () => {
                    if (variants.has(name)) {
                        out.line('isTypeOf: this.isTypeOf,')
                    }
                    for (const key in object.properties) {
                        const prop = object.properties[key]
                        out.line(`${key}: ${marshalToJson(prop, 'this.' + key)},`)
                    }
                })
            })
        })
        out.write()
    }

    function importReferencedModel(imports: ImportRegistry, prop: Prop) {
        switch(prop.type.kind) {
            case 'enum':
            case 'object':
            case 'union':
                imports.useModel(prop.type.name)
                break
            case 'fk':
            case 'lookup':
            case 'list-lookup':
                imports.useModel(prop.type.entity)
                break
            case 'list':
                importReferencedModel(imports, prop.type.item)
                break
        }
    }

    function marshalFromJson(prop: Prop, exp: string): string {
        // assumes exp is a pure variable or prop access
        let convert: string
        switch(prop.type.kind) {
            case 'scalar':
                if (prop.type.name == 'JSON') return exp
                convert = `marshal.${prop.type.name.toLowerCase()}.fromJSON(${exp})`
                break
            case 'enum':
                convert = `marshal.enumFromJson(${exp}, ${prop.type.name})`
                break
            case 'fk':
                convert = `marshal.string.fromJSON(${exp})`
                break
            case 'object':
                convert = `new ${prop.type.name}(undefined, ${
                    prop.nullable ? exp : `marshal.nonNull(${exp})`
                })`
                break
            case 'union':
                convert = `fromJson${prop.type.name}(${exp})`
                break
            case 'list':
                convert = `marshal.fromList(${exp}, val => ${marshalFromJson(
                    prop.type.item,
                    'val'
                )})`
                break
            default:
                throw unexpectedCase(prop.type.kind)
        }
        if (prop.nullable) {
            convert = `${exp} == null ? undefined : ${convert}`
        }
        return convert
    }

    function marshalToJson(prop: Prop, exp: string): string {
        // assumes exp is a pure variable or prop access
        let convert: string
        switch(prop.type.kind) {
            case 'scalar':
                switch(prop.type.name) {
                    case 'ID':
                    case 'String':
                    case 'Boolean':
                    case 'Int':
                    case 'Float':
                    case 'JSON':
                        return exp
                    default:
                        convert = `marshal.${prop.type.name.toLowerCase()}.toJSON(${exp})`
                }
                break
            case 'enum':
            case 'fk':
                return exp
            case 'object':
            case 'union':
                convert = exp + '.toJSON()'
                break
            case 'list': {
                let marshal = marshalToJson(prop.type.item, 'val')
                if (marshal == 'val') return exp
                convert = `${exp}.map((val: any) => ${marshal})`
                break
            }
            default:
                throw unexpectedCase(prop.type.kind)
        }
        if (prop.nullable) {
            convert = `${exp} == null ? undefined : ${convert}`
        }
        return convert
    }

    function generateUnion(name: string, union: Union): void {
        index.line(`export * from "./_${toCamelCase(name)}"`)
        const out = dir.file(`_${toCamelCase(name)}.ts`)
        const imports = new ImportRegistry(name)
        out.lazy(() => imports.render(model, out))
        union.variants.forEach((v) => imports.useModel(v))
        out.line()
        out.line(`export type ${name} = ${union.variants.join(' | ')}`)
        out.line()
        out.block(`export function fromJson${name}(json: any): ${name}`, () => {
            out.block(`switch(json?.isTypeOf)`, () => {
                union.variants.forEach((v) => {
                    out.line(`case '${v}': return new ${v}(undefined, json)`)
                })
                out.line(
                    `default: throw new TypeError('Unknown json object passed as ${name}')`
                )
            })
        })
        out.write()
    }

    function generateEnum(name: string, e: Enum): void {
        index.line(`export * from "./_${toCamelCase(name)}"`)
        const out = dir.file(`_${toCamelCase(name)}.ts`)
        out.block(`export enum ${name}`, () => {
            for (const val in e.values) {
                out.line(`${val} = "${val}",`)
            }
        })
        out.write()
    }
}


function getPropJsType(imports: ImportRegistry, owner: 'entity' | 'object', prop: Prop): string {
    let type: string
    switch(prop.type.kind) {
        case 'scalar':
            type = getScalarJsType(prop.type.name)
            if (type == 'BigDecimal') {
                imports.useBigDecimal()
            }
            break
        case 'enum':
        case 'object':
        case 'union':
            type = prop.type.name
            break
        case 'fk':
            if (owner === 'entity') {
                type = prop.type.entity
            } else {
                type = 'string'
            }
            break
        case 'lookup':
            type = prop.type.entity
            break
        case 'list-lookup':
            type = prop.type.entity + '[]'
            break
        case 'list':
            type = getPropJsType(imports, 'object', prop.type.item)
            if (type.indexOf('|')) {
                type = `(${type})[]`
            } else {
                type += '[]'
            }
            break
        default:
            throw unexpectedCase((prop.type as any).kind)
    }
    if (prop.nullable) {
        type += ' | undefined | null'
    }
    return type
}


function getScalarJsType(typeName: string): string {
    switch(typeName) {
        case 'ID':
        case 'String':
            return 'string'
        case 'Int':
        case 'Float':
            return 'number'
        case 'Boolean':
            return 'boolean'
        case 'DateTime':
            return 'Date'
        case 'BigInt':
            return 'bigint'
        case 'BigDecimal':
            return 'BigDecimal'
        case 'Bytes':
            return 'Uint8Array'
        case 'JSON':
            return 'unknown'
        default:
            throw unexpectedCase(typeName)
    }
}


function getEnumMaxLength(model: Model, enumName: string): number {
    const e = model[enumName]
    assert(e.kind === 'enum')
    return Object.keys(e.values).reduce((max, v) => Math.max(max, v.length), 0)
}


function collectVariants(model: Model): Set<string> {
    const variants = new Set<string>()
    for (const name in model) {
        const item = model[name]
        if (item.kind === 'union') {
            item.variants.forEach((v) => variants.add(v))
        }
    }
    return variants
}


function addIndexAnnotation(entity: Entity, field: string, imports: ImportRegistry, out: Output): void {
    let index = getFieldIndex(entity, field)
    if (index == null) return
    imports.useTypeorm('Index')
    if (index.unique) {
        out.line(`@Index_({unique: true})`)
    } else {
        out.line(`@Index_()`)
    }
}


function getFieldIndex(entity: Entity, field: string): {unique?: boolean} | undefined {
    if (entity.properties[field]?.unique) return {unique: true}
    let candidates = entity.indexes?.filter(index => index.fields[0]?.name == field) || []
    if (candidates.length == 0) return undefined
    if (candidates.find(index => index.fields.length == 1 && index.unique)) return {unique: true}
    if (candidates.some(index => index.fields.length > 1)) return undefined
    return candidates[0]
}


function printComment(obj: { description?: string }, out: Output) {
    if (obj.description) {
        const lines = obj.description.split('\n')
        out.blockComment(lines)
    }
}


class ImportRegistry {
    private typeorm = new Set<string>()
    private model = new Set<string>()
    private marshal = false
    private bigdecimal = false
    private assert = false

    constructor(private owner: string) {}

    useTypeorm(...names: string[]): void {
        names.forEach((name) => this.typeorm.add(name))
    }

    useModel(...names: string[]): void {
        names.forEach((name) => {
            if (name == this.owner) return
            this.model.add(name)
        })
    }

    useMarshal() {
        this.marshal = true
    }

    useBigDecimal() {
        this.bigdecimal = true
    }

    useAssert() {
        this.assert = true
    }

    render(model: Model, out: Output): void {
        if (this.bigdecimal) {
            out.line(`import {BigDecimal} from "@subsquid/big-decimal"`)
        }
        if (this.assert) {
            out.line('import assert from "assert"')
        }
        if (this.typeorm.size > 0) {
            const importList = Array.from(this.typeorm).map(
                (name) => name + ' as ' + name + '_'
            )
            out.line(`import {${importList.join(', ')}} from "typeorm"`)
        }
        if (this.marshal) {
            out.line(`import * as marshal from "./marshal"`)
        }
        for (const name of this.model) {
            switch(model[name].kind) {
                case 'entity':
                    out.line(
                        `import {${name}} from "./${toCamelCase(name)}.model"`
                    )
                    break
                default: {
                    const names = [name]
                    if (model[name].kind === 'union') {
                        names.push('fromJson' + name)
                    }
                    out.line(
                        `import {${names.join(', ')}} from "./_${toCamelCase(name)}"`
                    )
                }
            }
        }
    }
}
