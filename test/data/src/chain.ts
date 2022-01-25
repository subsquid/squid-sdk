import {ApiPromise, WsProvider} from "@polkadot/api"
import {l} from "@polkadot/api/util"
import {GenericEventData} from "@polkadot/types"
import {xxhashAsU8a} from "@polkadot/util-crypto"
import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {Codec} from "@subsquid/scale-codec"
import {Codec as JsonCodec} from "@subsquid/scale-codec-json"
import {
    ChainDescription,
    decodeMetadata,
    getChainDescriptionFromMetadata,
    getOldTypesBundle
} from "@subsquid/substrate-metadata"
import {ChainVersion} from "@subsquid/substrate-metadata-explorer"
import {getTypesFromBundle} from "@subsquid/substrate-metadata/lib/old/typesBundle"
import {assertNotNull, def, toCamelCase} from "@subsquid/util"
import assert from "assert"
import * as fs from "fs"
import * as path from "path"
import expect from "expect"
import {ProgressReporter} from "./util"


export class Chain {
    constructor(private name: string) {}

    @def
    info(): {chain: string, archive: string} {
       return require(this.item('info.json'))
    }

    @def
    versions(): ChainVersion[] {
        return require(this.item('versions.json'))
    }

    @def
    blocks(): number[] {
        let blocks: number[] = []
        let versions = this.versions()
        let total = 1000
        let height = versions[versions.length-1].blockNumber
        assert(total < height)
        for (let i = 0; i < versions.length - 1; i++) {
            let beg = versions[i].blockNumber + 1
            let end = versions[i+1].blockNumber
            let len = end - beg + 1
            let size = Math.max(Math.min(len, 10), Math.floor(total * len / height))
            while (len) {
                blocks.push(beg)
                size -= 1
                beg += Math.floor(len / size)
                len = end - beg + 1
            }
        }
        for (let i = height + 1; i < height + 100; i++) {
            blocks.push(i)
        }
        return blocks
    }

    async saveEvents(): Promise<void> {
        let out = this.item('events.jsonl')
        let saved = this.getSavedBlocks(out)
        let client = new ResilientRpcClient(this.info().chain)
        try {
            let progress = new ProgressReporter(this.blocks().length)
            for (let h of this.blocks()) {
                if (saved.has(h)) continue
                let blockHash = await client.call('chain_getBlockHash', [h])
                let events = await client.call('state_getStorageAt', [this.eventStorageKey(), blockHash])
                fs.appendFileSync(out, JSON.stringify({blockNumber: h, events}) + '\n')
                progress.block(h)
            }
            progress.report()
        } finally {
            client.close()
        }
    }

    private getSavedBlocks(file: string): Set<number> {
        let blocks = this.readJsonLines<{blockNumber: number}>(file)
        return new Set(
            blocks.map(b => b.blockNumber)
        )
    }

    @def
    eventStorageKey(): string {
        let moduleHash = xxhashAsU8a('System', 128)
        let itemHash = xxhashAsU8a('Events', 128)
        return '0x' + Buffer.from([...moduleHash, ...itemHash]).toString('hex')
    }

    saveEventsByPolka(): Promise<void> {
        return this.withPolka(async api => {
            let out = this.item('events-by-polka.jsonl')
            let saved = this.getSavedBlocks(out)
            let progress = new ProgressReporter(this.blocks().length)
            for (let h of this.blocks()) {
                if (saved.has(h)) continue
                let blockHash = await api.rpc.chain.getBlockHash(h)
                let events
                try {
                    events = await api.query.system.events.at(blockHash)
                } catch(e: any) {
                    throw new Error(`Failed to fetch events for block ${h}:\n\n` + e.stack)
                }
                let normalizedEvents = events.map(e => {
                    // normalize event presentation, so
                    // that it follows rules for regular scale types
                    return {
                        phase: e.phase,
                        event: {
                            [e.event.section]: {
                                [toCamelCase(e.event.method)]: normalizeGenericEventData(e.event.data)
                            }
                        },
                        topics: e.topics
                    }
                })
                fs.appendFileSync(out, JSON.stringify({blockNumber: h, events: normalizedEvents}) + '\n')
                progress.block(h)
            }
        })
    }

    testEventsDecoding(): void {
        let squid = this.decodeEvents()
        let polka = new Map(this.decodeEventsFromPolka().map(e => [e.blockNumber, e]))
        squid.forEach(se => {
            let pe = polka.get(se.blockNumber)
            if (pe == null) return
            expect(se).toEqual(pe)
        })
    }

    decodeEvents(): DecodedBlockEvents[] {
        let blocks: BlockEvents[] = this.readJsonLines('events.jsonl')
        return blocks.map(b => {
            let d = this.getVersion(b.blockNumber)
            let events = d.codec.decodeBinary(d.description.eventRecordList, b.events)
            return {blockNumber: b.blockNumber, events}
        })
    }

    decodeEventsFromPolka(): DecodedBlockEvents[] {
        let blocks: DecodedBlockEvents[] = this.readJsonLines('events-by-polka.jsonl')
        return blocks.map(b => {
            let d = this.getVersion(b.blockNumber)
            let events = d.jsonCodec.decode(d.description.eventRecordList, b.events)
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
            let typesBundle = getOldTypesBundle(this.name)
            let types = typesBundle && getTypesFromBundle(typesBundle, v.specVersion)
            let description = getChainDescriptionFromMetadata(metadata, types)
            return {
                blockNumber: v.blockNumber,
                specVersion: v.specVersion,
                description,
                codec: new Codec(description.types),
                jsonCodec: new JsonCodec(description.types)
            }
        })
    }

    async getMetadataByPolka(blockNumber: number) {
        return this.withPolka(async api => {
            let hash = await api.rpc.chain.getBlockHash(blockNumber)
            return api.rpc.state.getMetadata(hash)
        })
    }

    private async withPolka<T>(cb: (api: ApiPromise) => Promise<T>): Promise<T> {
        let bundle = this.name == 'polkadot' || this.name == 'kusama'
            ? undefined
            : getOldTypesBundle(this.name)

        let api = new ApiPromise({
            provider: new WsProvider(this.info().chain),
            types: bundle?.types as any,
            typesAlias: bundle?.typesAlias,
            typesBundle: bundle && {
                spec: {
                    [this.name]: {
                        types: bundle.versions as any
                    }
                }
            }
        })
        try {
            await api.isReadyOrError
            return await cb(api)
        } finally {
            await api.disconnect()
        }
    }

    private item(name: string): string {
        return path.resolve(__dirname, '..', this.name, name)
    }

    private readJsonLines<T>(name: string): T[] {
        let lines = fs.readFileSync(this.item(name), 'utf-8').split('\n')
        let out: T[] = []
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim()
            if (line) {
                out.push(JSON.parse(line))
            }
        }
        return out
    }
}


/**
 * Normalize event arguments, so that they follow rules for regular scale types
 */
function normalizeGenericEventData(data: GenericEventData): any {
    if (data.length == 0) return null
    let fields = data.meta.fields
    let named = fields[0].name.isSome
    if (named) {
        let obj: any = {}
        for (let i = 0; i < fields.length; i++) {
            let name = toCamelCase(fields[i].name.unwrap().toString())
            obj[name] = data[i]
        }
        return obj
    } else if (data.length == 1) {
        return data[0]
    } else {
        return data
    }
}


interface VersionDescription {
    blockNumber: number
    specVersion: number
    description: ChainDescription
    codec: Codec
    jsonCodec: JsonCodec
}


interface DecodedBlockEvents {
    blockNumber: number
    events: any[]
}


interface BlockEvents {
    blockNumber: number
    events: string
}
