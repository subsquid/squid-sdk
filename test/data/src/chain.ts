import {ApiPromise, WsProvider} from "@polkadot/api"
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
       return require(`../${this.name}/info.json`)
    }

    @def
    versions(): ChainVersion[] {
        return require(`../${this.name}/versions.json`)
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
        let client = new ResilientRpcClient(this.info().chain)
        let out: number | undefined
        try {
            out = fs.openSync(this.item('events.jsonl'), 'a')
            let progress = new ProgressReporter(this.blocks().length)
            for (let h of this.blocks()) {
                let blockHash = await client.call('chain_getBlockHash', [h])
                let events = await client.call('state_getStorageAt', [this.eventStorageKey(), blockHash])
                fs.appendFileSync(out, JSON.stringify({blockNumber: h, events}) + '\n')
                progress.block(h)
            }
            progress.report()
        } finally {
            if (out != null) fs.closeSync(out)
            client.close()
        }
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
            fs.writeFileSync(out, '')
            let progress = new ProgressReporter(this.blocks().length)
            for (let h of this.blocks()) {
                let blockHash = await api.rpc.chain.getBlockHash(h)
                let events = await api.query.system.events.at(blockHash)
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
        let polka = this.decodeEventsFromPolka()
        assert(squid.length == polka.length)
        for (let i = 0; i < squid.length; i++) {
            expect(squid[i]).toEqual(polka[i])
        }
    }

    decodeEvents(): DecodedBlockEvents[] {
        let out: DecodedBlockEvents[] = []
        let lines = fs.readFileSync(this.item('events.jsonl'), 'utf-8').split('\n')
        lines.forEach(line => {
            line = line.trim()
            if (!line) return
            let rec: BlockEvents = JSON.parse(line)
            let d = this.getVersion(rec.blockNumber)
            let events = d.codec.decodeBinary(d.description.eventRecordList, rec.events)
            out.push({blockNumber: rec.blockNumber, events})
        })
        return out
    }

    decodeEventsFromPolka(): DecodedBlockEvents[] {
        let out: DecodedBlockEvents[] = []
        let lines = fs.readFileSync(this.item('events-by-polka.jsonl'), 'utf-8').split('\n')
        lines.forEach(line => {
            line = line.trim()
            if (!line) return
            let rec: DecodedBlockEvents = JSON.parse(line)
            let d = this.getVersion(rec.blockNumber)
            let events = d.jsonCodec.decode(d.description.eventRecordList, rec.events)
            out.push({blockNumber: rec.blockNumber, events})
        })
        return out
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

    async withPolka<T>(cb: (api: ApiPromise) => Promise<T>): Promise<T> {
        let api = await ApiPromise.create({
            provider: new WsProvider(this.info().chain)
        })
        try {
            return await cb(api)
        } finally {
            await api.disconnect()
        }
    }

    private item(name: string): string {
        return path.join(__dirname, '..', this.name, name)
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
