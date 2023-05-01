import {Codec as ScaleCodec, JsonCodec} from '@subsquid/scale-codec'
import {
    ChainDescription,
    decodeExtrinsic,
    decodeMetadata,
    encodeExtrinsic,
    getChainDescriptionFromMetadata,
    getOldTypesBundle
} from '@subsquid/substrate-metadata'
import {readSpecVersions, SpecVersion} from '@subsquid/substrate-metadata-explorer/lib/specVersion'
import * as eac from '@subsquid/substrate-metadata/lib/events-and-calls'
import {getTypesFromBundle} from '@subsquid/substrate-metadata/lib/old/typesBundle'
import {assertNotNull, def, last} from '@subsquid/util-internal'
import {toHex} from '@subsquid/util-internal-hex'
import {HttpClient} from '@subsquid/http-client'
import {readLines} from '@subsquid/util-internal-read-lines'
import {RpcClient} from '@subsquid/util-internal-resilient-rpc'
import expect from 'expect'
import * as fs from 'fs'
import * as path from 'path'
import * as pg from 'pg'
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

    async selectTestBlocks(): Promise<void> {
        let selected = new Set(this.readIfExists<number[]>('block-numbers.json'))
        let maxSelected = -1
        for (let b of selected.values()) {
            maxSelected = Math.max(maxSelected, b)
        }
        let versions = this.description()
        await this.withDatabase(async db => {
            for (let i = 0; i < versions.length; i++) {
                let beg = versions[i].blockNumber + 1
                let end = i + 1 < versions.length ? versions[i+1].blockNumber : beg + 10000
                if (end < maxSelected) continue
                let v = versions[i]
                for (let event in v.events.definitions) {
                    let result = await db.query({
                        text: `SELECT block_number FROM substrate_event WHERE name = $1 AND block_number >= $2 AND block_number <= $3 LIMIT 5`,
                        values: [event, beg, end]
                    })
                    result.rows.forEach(row => {
                        selected.add(Number.parseInt(row.block_number))
                    })
                    console.log(`spec: ${v.specVersion}, total: ${selected.size}, event: ${event}`)
                }
                for (let call in v.calls.definitions) {
                    let result = await db.query({
                        text: `SELECT block_number FROM substrate_extrinsic WHERE name = $1 AND block_number >= $2 AND block_number <= $3 LIMIT 5`,
                        values: [call, beg, end]
                    })
                    result.rows.forEach(row => {
                        selected.add(Number.parseInt(row.block_number))
                    })
                    console.log(`spec: ${v.specVersion}, total: ${selected.size}, call: ${call}`)
                }
            }
        })
        let blockList = Array.from(selected).sort((a, b) => a - b)
        this.save('block-numbers.json', blockList)
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
            let d = this.getVersion(b.blockNumber)
            let extrinsics = b.extrinsics.map(ex => {
                return toHex(
                    encodeExtrinsic(ex, d.description, d.codec)
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
                let d = this.getVersion(b.blockNumber)
                let fromEncoded = decodeExtrinsic(encoded[i].extrinsic, d.description, d.codec)
                let fromOriginal = decodeExtrinsic(b.extrinsic, d.description, d.codec)
                expect(fromEncoded).toEqual(fromOriginal)
            }
        }
    }

    @def
    decodedExtrinsics(): DecodedBlockExtrinsics[] {
        let blocks = this.blocks()
        return blocks.map(b => {
            let d = this.getVersion(b.blockNumber)
            let extrinsics = b.extrinsics.map(hex => {
                return decodeExtrinsic(hex, d.description, d.codec)
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
        this.description().forEach(v => {
            for (let pallet in v.description.constants) {
                for (let name in v.description.constants[pallet]) {
                    let def = v.description.constants[pallet][name]
                    let value = v.codec.decodeBinary(def.type, def.value)
                    let encoded = v.codec.encodeToBinary(def.type, value)
                    expect({pallet, name, bytes: encoded}).toEqual({pallet, name, bytes: def.value})
                }
            }
        })
    }

    testEventsScaleEncodingDecoding(): void {
        let decoded = this.decodedEvents()
        let encoded = decoded.map(b => {
            let d = this.getVersion(b.blockNumber)
            let events = d.codec.encodeToHex(d.description.eventRecordList, b.events)
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
            let d = this.getVersion(b.blockNumber)
            let events = d.codec.decodeBinary(d.description.eventRecordList, b.events)
            return {blockNumber: b.blockNumber, events}
        })
    }

    getVersion(blockNumber: number): VersionDescription {
        let description = this.description()
        let next = description.findIndex(d => d.blockNumber >= blockNumber)
        let e = next < 0 ? description[description.length - 1] : description[next - 1]
        return assertNotNull(e, `not found metadata for block ${blockNumber}`)
    }

    @def
    description(): VersionDescription[] {
        return this.versions().map(v => {
            let metadata = decodeMetadata(v.metadata)
            let typesBundle = getOldTypesBundle(v.specName)
            let types = typesBundle && getTypesFromBundle(typesBundle, v.specVersion)
            let description = getChainDescriptionFromMetadata(metadata, types)
            return {
                ...v,
                description,
                codec: new ScaleCodec(description.types),
                jsonCodec: new JsonCodec(description.types),
                events: new eac.Registry(description.types, description.event),
                calls: new eac.Registry(description.types, description.call)
            }
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
            endpoints: [{url: this.info().chain, capacity: 5}],
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

    private archiveRequest<T>(query: string): Promise<T> {
        return this.archiveClient().graphqlRequest(query)
    }

    private async withDatabase<T>(cb: (client: pg.Client) => Promise<T>): Promise<T> {
        let connectionString = assertNotNull(process.env.DB, 'DB env variable is not specified')
        let client = new pg.Client(connectionString)
        await client.connect()
        try {
            return await cb(client)
        } finally {
            await client.end()
        }
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


interface VersionDescription extends SpecVersion {
    description: ChainDescription
    codec: ScaleCodec
    jsonCodec: JsonCodec
    events: eac.Registry
    calls: eac.Registry
}


interface DecodedBlockEvents {
    blockNumber: number
    events: any[]
}


interface RawBlockEvents {
    blockNumber: number
    events: string
}


interface RawBlock extends RpcBlock {
    blockNumber: number
}


interface RpcBlock {
    header: {
        number: string
        parentHash: string
        digest: {
            logs: string[]
        }
    }
    extrinsics: string[]
}


interface DecodedBlockExtrinsics {
    blockNumber: number
    extrinsics: any[]
}
