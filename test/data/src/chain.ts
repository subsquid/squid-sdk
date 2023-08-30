import {HttpClient} from '@subsquid/http-client'
import {RpcClient} from '@subsquid/rpc-client'
import {readSpecVersions, SpecVersion} from '@subsquid/substrate-metadata-explorer/lib/specVersion'
import {Bytes, Runtime} from '@subsquid/substrate-runtime'
import {decodeMetadata} from '@subsquid/substrate-runtime/lib/metadata'
import {assertNotNull, def, last} from '@subsquid/util-internal'
import {toHex} from '@subsquid/util-internal-hex'
import {readLines} from '@subsquid/util-internal-read-lines'
import assert from 'assert'
import expect from 'expect'
import * as fs from 'fs'
import * as path from 'path'
import {ProgressReporter} from './util'


export class Chain {
    constructor(private name: string) {}

    @def
    info(): {chain: string, archive?: string} {
       return this.read('info.json')
    }

    @def
    versions(): SpecVersion[] {
        return readSpecVersions(this.item('versions.jsonl'))
    }

    @def
    blockNumbers(): number[] {
       return this.read('block-numbers.json')
    }

    async saveBlocks(): Promise<void> {
        let out = this.item('blocks.jsonl')
        let unsaved = this.getUnsavedBlocks(out)
        if (unsaved.length == 0) return
        console.log(`Saving ${unsaved.length} blocks`)
        let progress = new ProgressReporter(unsaved.length)
        await this.withRpcClient(async client => {
            for (let blockNumber of unsaved) {
                let blockHash: string = await client.call('chain_getBlockHash', [blockNumber])
                let block: {block: RpcBlock} = await client.call('chain_getBlock', [blockHash])
                this.append(out, {
                    blockNumber,
                    ...block.block
                })
                progress.tick()
            }
            progress.report()
        })
    }

    @def
    blocks(): RawBlock[] {
        return this.readLines('blocks.jsonl')
    }

    async saveEvents(): Promise<void> {
        let out = this.item('events.jsonl')
        let unsaved = this.getUnsavedBlocks(out)
        if (unsaved.length == 0) return
        console.log(`Saving events for ${unsaved.length} blocks`)
        let progress = new ProgressReporter(unsaved.length)
        await this.withRpcClient(async client => {
            for (let blockNumber of unsaved) {
                let blockHash = await client.call('chain_getBlockHash', [blockNumber])
                let events = await client.call('state_getStorageAt', [
                    '0x26aa394eea5630e07c48ae0c9558cef780d41e5e16056765bc8461851072c9d7',
                    blockHash
                ])
                this.append(out, {blockNumber, events})
                progress.tick()
            }
            progress.report()
        })
    }

    @def
    events(): RawBlockEvents[] {
        return this.readLines('events.jsonl')
    }

    private getUnsavedBlocks(file: string): number[] {
        let saved = this.getSavedBlocks(file)
        return this.blockNumbers().filter(n => !saved.has(n))
    }

    private getSavedBlocks(file: string): Set<number> {
        file = this.item(file)
        if (!fs.existsSync(file)) return new Set()
        let blocks = this.readLines<{blockNumber: number}>(file)
        return new Set(
            blocks.map(b => b.blockNumber)
        )
    }

    testExtrinsicsScaleEncodingDecoding(): void {
        let decoded = this.decodedExtrinsics()

        let encoded = decoded.map(b => {
            let runtime = this.getRuntime(b.blockNumber)
            let extrinsics = b.extrinsics.map(ex => {
                return toHex(
                    runtime.encodeExtrinsic(ex)
                )
            })
            return {
                blockNumber: b.blockNumber,
                extrinsics
            }
        }).flatMap(b => {
            return b.extrinsics.map((extrinsic, idx) => {
                return {
                    blockNumber: b.blockNumber,
                    idx,
                    extrinsic
                }
            })
        })

        let original = this.blocks().map(b => {
            return {
                blockNumber: b.blockNumber,
                extrinsics: b.extrinsics
            }
        }).flatMap(b => {
            return b.extrinsics.map((extrinsic, idx) => {
                return {
                    blockNumber: b.blockNumber,
                    idx,
                    extrinsic
                }
            })
        })

        for (let i = 0; i < encoded.length; i++) {
            try {
                expect(encoded[i]).toEqual(original[i])
            } catch(e) { // FIXME SQD-749
                let b = original[i]
                let runtime = this.getRuntime(b.blockNumber)
                let fromEncoded = runtime.decodeExtrinsic(encoded[i].extrinsic)
                let fromOriginal = runtime.decodeExtrinsic(b.extrinsic)
                expect(fromEncoded).toEqual(fromOriginal)
            }
        }
    }

    @def
    decodedExtrinsics(): DecodedBlockExtrinsics[] {
        let blocks = this.blocks()
        return blocks.map(b => {
            let runtime = this.getRuntime(b.blockNumber)
            let extrinsics = b.extrinsics.map(hex => {
                return runtime.decodeExtrinsic(hex)
            })
            return {
                blockNumber: b.blockNumber,
                extrinsics
            }
        })
    }

    testConstantsScaleEncodingDecoding(): void {
        switch(this.name) { // FIXME
            case 'heiko':
            case 'kintsugi':
                return
        }
        this.runtimes().forEach(([bn, rt]) => {
            for (let pallet in rt.description.constants) {
                for (let name in rt.description.constants[pallet]) {
                    let def = rt.description.constants[pallet][name]
                    let value = rt.getConstant(pallet + '.' + name)
                    let encoded = rt.scaleCodec.encodeToBinary(def.type, value)
                    expect({pallet, name, bytes: encoded}).toEqual({pallet, name, bytes: def.value})
                }
            }
        })
    }

    testEventsScaleEncodingDecoding(): void {
        let decoded = this.decodedEvents()
        let encoded = decoded.map(b => {
            let runtime = this.getRuntime(b.blockNumber)
            let events = runtime.scaleCodec.encodeToHex(runtime.description.eventRecordList, b.events)
            return {blockNumber: b.blockNumber, events}
        })
        let original = this.events()
        for (let i = 0; i < decoded.length; i++) {
            expect(encoded[i]).toEqual(original[i])
        }
    }

    @def
    decodedEvents(): DecodedBlockEvents[] {
        let blocks = this.events()
        return blocks.map(b => {
            let runtime = this.getRuntime(b.blockNumber)
            let events = runtime.decodeStorageValue('System.Events', b.events)
            return {blockNumber: b.blockNumber, events}
        })
    }

    getRuntime(blockNumber: number): Runtime {
        let runtimes = this.runtimes()
        let next = runtimes.findIndex(d => d[0] >= blockNumber)
        let e = next < 0 ? runtimes[runtimes.length - 1] : runtimes[next - 1]
        assert(e != null, `not found metadata for block ${blockNumber}`)
        return e[1]
    }

    @def
    runtimes(): [blockNumber: number, runtime: Runtime][] {
        return this.versions().map(v => {
            return [
                v.blockNumber,
                new Runtime(
                    {
                        specName: v.specName,
                        specVersion: v.specVersion,
                        implName: '-',
                        implVersion: 0
                    },
                    v.metadata
                )
            ]
        })
    }

    printMetadata(specVersion?: number): void {
        let versions = this.versions()
        let v = specVersion == null
            ? last(versions)
            : versions.find(v => v.specVersion == specVersion)
        if (v) {
            let metadata = decodeMetadata(v.metadata)
            console.log(JSON.stringify(metadata, null, 2))
        }
    }

    private async withRpcClient<T>(cb: (client: RpcClient) => Promise<T>): Promise<T> {
        let client = new RpcClient({
            url: this.info().chain,
            retryAttempts: 3
        })
        try {
            return await cb(client)
        } finally {
            client.close()
        }
    }

    @def
    private archiveClient(): HttpClient {
       return new HttpClient({
           baseUrl: assertNotNull(this.info().archive),
           retryAttempts: 3
       })
    }

    private item(name: string): string {
        return path.resolve(__dirname, '../chain', this.name, name)
    }

    private readLines<T>(name: string): T[] {
        if (!this.exists(name)) return []
        let out: T[] = []
        for (let line of readLines(this.item(name))) {
            out.push(JSON.parse(line))
        }
        return out
    }

    private read<T>(name: string): T {
        let content = this.readFile(name)
        return JSON.parse(content)
    }

    private readIfExists<T>(name: string): T | undefined {
        if (this.exists(name)) {
            return this.read(name)
        } else {
            return undefined
        }
    }

    private save(file: string, content: string | object): void {
        if (typeof content != 'string') {
            content = JSON.stringify(content, null, 2)
        }
        fs.writeFileSync(this.item(file), content)
    }

    private append(file: string, content: string | object): void {
        if (typeof content != 'string') {
            content = JSON.stringify(content)
        }
        fs.appendFileSync(this.item(file), content + '\n')
    }

    private exists(name: string): boolean {
        return fs.existsSync(this.item(name))
    }

    private readFile(name: string): string {
        return fs.readFileSync(this.item(name), 'utf-8')
    }
}


interface DecodedBlockEvents {
    blockNumber: number
    events: any[]
}


interface RawBlockEvents {
    blockNumber: number
    events: Bytes
}


interface RawBlock extends RpcBlock {
    blockNumber: number
}


interface RpcBlock {
    header: {
        number: string
        parentHash: Bytes
        digest: {
            logs: Bytes[]
        }
    }
    extrinsics: Bytes[]
}


interface DecodedBlockExtrinsics {
    blockNumber: number
    extrinsics: any[]
}
