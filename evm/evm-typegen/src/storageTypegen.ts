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
            "import {StorageLayout, StorageItem, StructStorageItem, MappingStorageItem, ArrayStorageItem, DynamicArrayStorageItem, BytesStorageItem} from '@subsquid/evm-support'"
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
                this.out.line(`${i.label}: new ${this.getStorageItem(this.layout.types.get(i.type))}(`)
                this.out.indentation(() => this.out.line(`layout, '${i.type}', ${i.slot}n, ${i.offset}`))
                this.out.line('),')
            }
        })
    }

    private getStorageItem(type: StorageType): string {
        switch (type.encoding) {
            case 'inplace':
                if (type.members != null && type.base == null) {
                    return (
                        `StructStorageItem<{` +
                        type.members
                            .map((m) => `${m.label}: ${this.getStorageItem(this.layout.types.get(m.type))}`)
                            .join(', ') +
                        `}>`
                    )
                } else if (type.base != null && type.members == null) {
                    return `ArrayStorageItem<${this.getStorageItem(this.layout.types.get(type.base))}>`
                } else if (type.base == null && type.members == null) {
                    return `StorageItem<${getType(type)}>`
                } else {
                    throw unexpectedCase()
                }
            case 'mapping':
                return `MappingStorageItem<${getType(this.layout.types.get(type.key))}, ${this.getStorageItem(
                    this.layout.types.get(type.value)
                )}>`
            case 'dynamic_array':
                return `DynamicArrayStorageItem<${this.getStorageItem(this.layout.types.get(type.base))}>`
            case 'bytes':
                return `BytesStorageItem<${getType(type)}>`
            default:
                throw unexpectedCase()
        }
    }
}

export function getType(type: StorageType): string {
    // assert(isPrimitive(type.label))

    let match = type.label.match(/^(u?int)([0-9]+)$/)
    if (match || type.label.startsWith('enum')) {
        return type.numberOfBytes * 8n < 53n ? 'number' : 'bigint'
    }

    if (type.label === 'address' || type.label === 'string' || type.label.startsWith('contract')) {
        return 'string'
    }

    if (type.label.startsWith('bytes')) {
        return 'Uint8Array'
    }

    if (type.label === 'bool') {
        return 'boolean'
    }

    throw new Error()
}
