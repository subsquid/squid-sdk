import {
    ArrayInplaceType,
    BytesPartStorageItem,
    BytesType,
    DynamicArrayType,
    InplaceType,
    MappingType,
    StorageLayout,
    StructInplaceType,
} from '@subsquid/evm-support'
import {getItemOffset} from '@subsquid/evm-support/lib/storageLayout/util'
import {Logger} from '@subsquid/logger'
import {unexpectedCase} from '@subsquid/util-internal'
import {FileOutput, OutDir} from '@subsquid/util-internal-code-printer'
import {toCamelCase} from '@subsquid/util-naming'
import assert from 'assert'

export class StorageTypegen {
    private out: FileOutput

    constructor(private dest: OutDir, private layout: StorageLayout, private basename: string, private log: Logger) {
        this.out = dest.file(basename + '.ts')
    }

    generate(): void {
        this.out.line(
            "import {StorageLayout, StorageItem, MappingStorageItem, DynamicArrayStorageItem, BytesStorageItem, BytesPartStorageItem} from '@subsquid/evm-support'"
        )
        this.out.line(`import {LAYOUT_JSON} from './${this.basename}.layout'`)
        this.out.line()
        this.out.line('export const layout = new StorageLayout(LAYOUT_JSON);')

        this.generateClasses()
        this.generateStorage()

        this.writeLayout()
        this.out.write()
        this.log.info(`saved ${this.out.file}`)
    }

    private writeLayout() {
        let out = this.dest.file(this.basename + '.layout.ts')
        let json = this.layout.toJSON()
        json = JSON.stringify(JSON.parse(json), null, 4)
        out.line(`export const LAYOUT_JSON = ${json}`)
        out.write()
        this.log.info(`saved ${out.file}`)
    }

    private generateStorage() {
        let storage = this.layout.storage
        if (storage.length == 0) {
            return
        }
        this.out.line()
        this.out.block(`export const storage =`, () => {
            for (let i of storage) {
                let type = this.layout.types.get(i.type)
                this.out.line(`${i.label}: new ${getClassName(type.label)}(`)
                this.out.indentation(() => this.out.line(`layout, '${i.type}', ${i.slot}n, ${i.offset}`))
                this.out.line('),')
            }
        })
    }

    private generateClasses() {
        let types = Object.values(this.layout.types.definitions).sort((a, b) => a.label.localeCompare(b.label))
        for (let type of types) {
            this.out.line()
            switch (type.encoding) {
                case 'inplace':
                    this.generateInplaceClass(type)
                    break
                case 'mapping':
                    this.generateMappingClass(type)
                    break
                case 'dynamic_array':
                    this.generateDynamicArrayClass(type)
                    break
                case 'bytes':
                    this.generateBytesClass(type)
                    break
                default:
                    throw unexpectedCase()
            }
        }
    }

    private generateBytesClass(type: BytesType) {
        let className = getClassName(type.label)

        this.out.block(`class ${className} extends BytesStorageItem<${toType(type.label)}>`, () => {
            this.out.block(`at(index: number): BytesPartStorageItem<${toType(type.label)}>`, () => {
                this.out.line(`return this.part(BytesPartStorageItem, index)`)
            })
        })
    }

    private generateDynamicArrayClass(type: DynamicArrayType) {
        let className = getClassName(type.label)

        this.out.block(`class ${className} extends DynamicArrayStorageItem`, () => {
            let baseType = this.layout.types.get(type.base)
            let baseClass = getClassName(baseType.label)

            this.out.block(`at(index: number): ${baseClass}`, () => {
                this.out.line(`return this.item(${baseClass}, index)`)
            })
        })
    }

    private generateMappingClass(type: MappingType) {
        let className = getClassName(type.label)

        this.out.block(`class ${className} extends MappingStorageItem`, () => {
            let valueType = this.layout.types.get(type.value)
            let valueClass = getClassName(valueType.label)

            let keyType = this.layout.types.get(type.key)

            this.out.block(`get(key: ${toType(keyType.label)}): ${valueClass}`, () => {
                this.out.line(`return this.item(${valueClass}, key)`)
            })
        })
    }

    private generateInplaceClass(type: InplaceType) {
        if (type.members != null && type.base == null) {
            this.generateStructClass(type as StructInplaceType)
        } else if (type.base != null && type.members == null) {
            this.generateArrayClass(type as ArrayInplaceType)
        } else if (type.base == null && type.members == null) {
            return this.generateCommonClass(type)
        } else {
            throw unexpectedCase()
        }
    }

    private generateArrayClass(type: ArrayInplaceType) {
        let className = getClassName(type.label)

        this.out.block(`class ${className} extends StorageItem<unknown>`, () => {
            let baseType = this.layout.types.get(type.base)
            let baseClass = getClassName(baseType.label)

            let length = Number(type.numberOfBytes / baseType.numberOfBytes)

            this.out.line(`readonly length = ${length}`)
            for (let i = 0; i < length; i++) {
                this.out.line()
                let slot = (BigInt(i) * type.numberOfBytes) / 32n
                let offset = getItemOffset(i, Number(type.numberOfBytes))
                this.out.line(`;[${i}] = new ${baseClass}(this.layout, '${type.base}', this.slot + ${slot}n, ${offset})`)
            }
        })
    }

    private generateStructClass(type: StructInplaceType) {
        let className = getClassName(type.label)

        this.out.block(`class ${className} extends StorageItem<unknown>`, () => {
            for (let member of type.members) {
                let memberType = this.layout.types.get(member.type)
                let memberClass = getClassName(memberType.label)

                if (member.slot > 0n || member.offset > 0) this.out.line()
                this.out.line(
                    `readonly ${member.label} = new ${memberClass}(this.layout, '${type.base}', this.slot + ${member.slot}n, ${member.offset})`
                )
            }
        })
    }

    private generateCommonClass(type: InplaceType) {
        let className = getClassName(type.label)

        this.out.line(`class ${className} extends StorageItem<${toType(type.label)}> {}`)
    }
}

export function getClassName(type: string) {
    let name = getTypeName(type)
    return name + 'Item'
}

function getTypeName(type: string): string {
    let mapping = /^mapping\((.+?) => (.+?)\)$/.exec(type)
    if (mapping != null) {
        let key = getTypeName(mapping[1])
        let value = getTypeName(mapping[2])
        return key + value + 'Mapping'
    }

    let array = /^(.+?)\[(.*)\]/.exec(type)
    if (array != null) {
        if (array[2] !== '') {
            let length = Number(array[2])
            assert(Number.isInteger(length) && length > 0, `invalid array length: ${length}`)
        }
        let base = getTypeName(array[1])
        return base + 'Array' + (array[2] ?? '')
    }

    let struct = /^struct (.+)$/.exec(type)
    if (struct != null) {
        let name = struct[1].split('.').slice(-1)[0] // extract only struct name itself (ignore contract name)
        return toPascalCase(name) + 'Struct'
    }

    let enum_ = /^enum (.+)$/.exec(type)
    if (enum_ != null) {
        let name = enum_[1].split('.').slice(-1)[0] // extract only enum name itself (ignore contract name)
        return toPascalCase(name) + 'Enum'
    }

    let contract = /^contract (.+)$/.exec(type)
    if (contract != null) {
        return toPascalCase(contract[1]) + 'Contract'
    }

    let elementary = /^[a-z]+[0-9]*$/.exec(type)
    if (elementary != null) {
        return toPascalCase(elementary[0])
    }

    throw new Error(`Invalid type: ${type}`)
}

export function toType(type: string): string {
    let match = type.match(/^(u?int)([0-9]+)$/)
    if (match != null) {
        return Number(match[2]) * 8 < 53 ? 'number' : 'bigint'
    }

    if (type.startsWith('enum')) {
        return 'number'
    }

    if (type === 'address' || type === 'string' || type.startsWith('contract')) {
        return 'string'
    }

    if (type.startsWith('bytes')) {
        return 'Uint8Array'
    }

    if (type === 'bool') {
        return 'boolean'
    }

    throw new Error()
}

function toPascalCase(str: string) {
    return str[0].toUpperCase() + toCamelCase(str.slice(1))
}
