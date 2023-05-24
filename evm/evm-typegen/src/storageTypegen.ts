import * as ethers from 'ethers'
import {Logger} from '@subsquid/logger'
import {def} from '@subsquid/util-internal'
import {FileOutput, OutDir} from '@subsquid/util-internal-code-printer'
import {getFullTupleType, getKeysType, getReturnType, getStructType, getTupleType, getType} from './util/types'
import {StorageFragment, StorageLayout} from './util/storageLayout'

export class StorageTypegen {
    private out: FileOutput

    constructor(private dest: OutDir, private layout: StorageLayout, private basename: string, private log: Logger) {
        this.out = dest.file(basename + '.ts')
    }

    generate(): void {
        this.out.line("import {StorageLayout, StorageItem} from './layout.support'")
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
        let json = this.layout.formatJson()
        json = JSON.stringify(JSON.parse(json), null, 4)
        out.line(`export const LAYOUT_JSON = ${json}`)
        out.write()
        this.log.info(`saved ${out.file}`)
    }

    private generateStorage() {
        let storage = this.getStorage()
        if (storage.length == 0) {
            return
        }
        this.out.line()
        this.out.block(`export const storage =`, () => {
            for (let i of storage) {
                this.out.line(`${this.getPropName(i)}: new StorageItem<${getKeysType(i.slot)}>(`)
                this.out.indentation(() => this.out.line(`layout, '${i.name}'`))
                this.out.line('),')
            }
        })
    }

    private getPropName(item: StorageFragment): string {
        return item.name.includes('.') ? `'${item.name}'` : item.name
    }

    @def
    private getStorage(): StorageFragment[] {
        return this.layout.project.fragments
    }
}
