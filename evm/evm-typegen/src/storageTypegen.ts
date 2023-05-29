import {Logger} from '@subsquid/logger'
import {FileOutput, OutDir} from '@subsquid/util-internal-code-printer'
import {StorageLayout, StorageType} from '@subsquid/evm-support'
import {unexpectedCase} from '@subsquid/util-internal'

export class StorageTypegen {
    private out: FileOutput

    constructor(private dest: OutDir, private layout: StorageLayout, private basename: string, private log: Logger) {
        this.out = dest.file(basename + '.ts')
    }

    generate(): void {
        this.out.line(
            "import {StorageLayout, ValueStorageItem, StructStorageItem, MappingStorageItem, ArrayStorageItem, DynamicArrayStorageItem, BytesStorageItem} from '@subsquid/evm-support'"
        )
        this.out.line(`import {LAYOUT_JSON} from './${this.basename}.layout'`)
        this.out.line()
        this.out.line('export const layout = new StorageLayout(LAYOUT_JSON);')

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
                this.out.line(`${i.label}: new ${this.getStorageItem(i.type)}(`)
                this.out.indentation(() => this.out.line(`layout, '${i.type}', ${i.slot}n, ${i.offset}`))
                this.out.line('),')
            }
        })
    }

    // FIXME: this method duplicates `getItemConstructor` function, needs refactoring
    private getStorageItem(typeName: string): string {
        let type = this.layout.types.get(typeName)
        switch (type.encoding) {
            case 'inplace':
                if (type.members != null && type.base == null) {
                    return (
                        `StructStorageItem<{` +
                        type.members.map((m) => `${m.label}: ${this.getStorageItem(m.type)}`).join(', ') +
                        `}>`
                    )
                } else if (type.base != null && type.members == null) {
                    return `ArrayStorageItem<${this.getStorageItem(type.base)}>`
                } else if (type.base == null && type.members == null) {
                    return `ValueStorageItem<${getType(type.label)}>`
                } else {
                    throw unexpectedCase()
                }
            case 'mapping':
                return `MappingStorageItem<${getType(this.layout.types.get(type.key).label)}, ${this.getStorageItem(
                    type.value
                )}>`
            case 'dynamic_array':
                return `DynamicArrayStorageItem<${this.getStorageItem(type.base)}>`
            case 'bytes':
                return `BytesStorageItem<${getType(type.label)}>`
            default:
                throw unexpectedCase()
        }
    }
}

export function getType(type: string): string {
    // assert(isPrimitive(type.label))

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
