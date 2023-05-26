import * as ethers from 'ethers'
import {Logger} from '@subsquid/logger'
import {def} from '@subsquid/util-internal'
import {FileOutput, OutDir} from '@subsquid/util-internal-code-printer'
import {StorageFragment, StorageLayout, StorageType, getItemConstructor, uint256toHex} from './layout.support'
import {assert} from 'console'

export class StorageTypegen {
    private out: FileOutput

    constructor(private dest: OutDir, private layout: StorageLayout, private basename: string, private log: Logger) {
        this.out = dest.file(basename + '.ts')
    }

    generate(): void {
        this.out.line(
            "import {StorageLayout, StorageItem, StructStorageItem, MappingStorageItem, ArrayStorageItem, DynamicArrayStorageItem} from './layout.support'"
        )
        this.out.line(`import {LAYOUT_JSON} from './${this.basename}.layout'`)
        this.out.line()
        this.out.line('export const layout = LAYOUT_JSON;')

        this.generateStorage()

        this.writeLayout()
        this.out.write()
        this.log.info(`saved ${this.out.file}`)
    }

    private writeLayout() {
        let out = this.dest.file(this.basename + '.layout.ts')
        let json = JSON.stringify(this.layout, null, 4)
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
                this.out.line(`${i.label}: new ${this.getStorageItem(this.layout.types[i.type])}(`)
                this.out.indentation(() =>
                    this.out.line(`layout, layout.types['${i.type}'], '${uint256toHex(BigInt(i.slot))}', ${i.offset}`)
                )
                this.out.line('),')
            }
        })
    }

    private getStorageItem(type: StorageType): string {
        let constructor = getItemConstructor(type)
        let name = constructor.name

        switch (name) {
            case 'StructStorageItem':
                return (
                    `${name}<{` +
                    type
                        .members!.map((m) => `${m.label}: ${this.getStorageItem(this.layout.types[m.type])}`)
                        .join(', ') +
                    `}>`
                )
            case 'MappingStorageItem':
                return `${name}<${getType(this.layout.types[type.key!])}, ${this.getStorageItem(
                    this.layout.types[type.value!]
                )}>`
            case 'ArrayStorageItem':
            case 'DynamicArrayStorageItem':
                return `${name}<${this.getStorageItem(this.layout.types[type.base!])}>`
            case 'StorageItem':
                return `${name}<${getType(type)}>`
            default:
                throw new Error()
        }
    }
}

export function getType(type: StorageType): string {
    // assert(isPrimitive(type.label))

    let match = type.label.match(/^(u?int)([0-9]+)$/)
    if (match || type.label.startsWith('enum')) {
        return BigInt(type.numberOfBytes) * 8n < 53n ? 'number' : 'bigint'
    }

    if (type.label.startsWith('bytes') || type.label === 'address' || type.label === 'string') {
        return 'string'
    }

    if (type.label === 'bool') {
        return 'boolean'
    }

    throw new Error()
}
