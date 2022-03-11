import {ApiPromise, WsProvider} from "@polkadot/api"
import {GenericEventData} from "@polkadot/types"
import {FrameSystemEventRecord} from "@polkadot/types/lookup"
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
import * as eac from "@subsquid/substrate-metadata/lib/events-and-calls"
import {getTypesFromBundle} from "@subsquid/substrate-metadata/lib/old/typesBundle"
import {assertNotNull, def, toCamelCase} from "@subsquid/util"
import assert from "assert"
import expect from "expect"
import * as fs from "fs"
import fetch from "node-fetch"
import * as path from "path"
import * as pg from "pg"
import {ProgressReporter} from "./util"


export class Chain {
    constructor(private name: string) {}

    @def
    info(): {chain: string, archive: string} {
       return this.readJson('info.json')
    }

    @def
    versions(): ChainVersion[] {
        return this.readJson('versions.json')
    }

    async selectTestBlocks(): Promise<void> {
        let selected = new Set<number>()
        let versions = this.description()
        for (let i = 0; i < versions.length; i++) {
            let beg = versions[i].blockNumber + 1
            let end = i + 1 < versions.length ? versions[i+1].blockNumber : beg + 10000
            let v = versions[i]
            for (let event in v.events.definitions) {
                let result: {substrate_event: {blockNumber: number}[]} = await this.archiveRequest(`
                    query {
                        substrate_event(limit: 5 where: {name: {_eq: "${event}"}, blockNumber: {_gte: ${beg}, _lte: ${end}}}) {
                            blockNumber
                        }
                    }
                `)
                result.substrate_event.forEach(item => {
                    selected.add(item.blockNumber)
                })
                console.log(`spec: ${v.specVersion}, total: ${selected.size}, event: ${event}`)
            }
            for (let call in v.calls.definitions) {
                let result: {substrate_extrinsic: {blockNumber: number}[]} = await this.archiveRequest(`
                    query {
                        substrate_extrinsic(limit: 5 where: {name: {_eq: "${call}"}, blockNumber: {_gte: ${beg}, _lte: ${end}}}) {
                            blockNumber
                        }
                    }
                `)
                result.substrate_extrinsic.forEach(item => {
                    selected.add(item.blockNumber)
                })
                console.log(`spec: ${v.specVersion}, total: ${selected.size}, call: ${call}`)
            }
        }
        let blockList = Array.from(selected).sort((a, b) => a - b)
        this.save('blocks.json', blockList)
    }

    async selectTestBlocksFromDb(): Promise<void> {
        let selected = new Set<number>()
        let versions = this.description()
        await this.withDatabase(async db => {
            for (let i = 0; i < versions.length; i++) {
                let beg = versions[i].blockNumber + 1
                let end = i + 1 < versions.length ? versions[i+1].blockNumber : beg + 10000
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
        this.save('blocks.json', blockList)
    }

    @def
    blocks(): number[] {
       return this.readJson('blocks.json')
    }

    saveEvents(): Promise<void> {
        return this.withRpcClient(async client => {
            let out = this.item('events.jsonl')
            let saved = this.getSavedBlocks(out)
            let progress = new ProgressReporter(this.blocks().length)
            for (let h of this.blocks()) {
                if (saved.has(h)) continue
                let blockHash = await client.call('chain_getBlockHash', [h])
                let events = await client.call('state_getStorageAt', [this.eventStorageKey(), blockHash])
                this.append(out, {blockNumber: h, events})
                progress.block(h)
            }
            progress.report()
        })
    }

    private getSavedBlocks(file: string): Set<number> {
        file = this.item(file)
        if (!fs.existsSync(file)) return new Set()
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
                let events: FrameSystemEventRecord[]
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
                this.append(out, {blockNumber: h, events: normalizedEvents})
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
            expect({
                blockNumber: se.blockNumber,
                count: se.events.length
            }).toEqual({
                blockNumber: pe.blockNumber,
                count: pe.events.length
            })
            for (let i = 0; i < se.events.length; i++) {
                expect({
                    blockNumber: se.blockNumber,
                    blockEventIndex: i,
                    event: se.events[i]
                }).toEqual({
                    blockNumber: pe.blockNumber,
                    blockEventIndex: i,
                    event: pe.events[i]
                })
            }
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
                metadata,
                description,
                codec: new Codec(description.types),
                jsonCodec: new JsonCodec(description.types),
                events: new eac.Registry(description.types, description.event),
                calls: new eac.Registry(description.types, description.call)
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

    private async withRpcClient<T>(cb: (client: ResilientRpcClient) => Promise<T>): Promise<T> {
        let client = new ResilientRpcClient(this.info().chain)
        try {
            return await cb(client)
        } finally {
            client.close()
        }
    }

    private async archiveRequest<T>(query: string): Promise<T> {
        let attempt = 3
        while (attempt--) {
            try {
                return await this._archiveRequest(query)
            } catch(e: any) {
                if (attempt && (e.toString().startsWith('FetchError') || /Got http 5/.test(e.toString()))) {
                    console.log(`error: ${e.message}`)
                    await new Promise(resolve => setTimeout(resolve, 1000))
                } else {
                    throw e
                }
            }
        }
        assert(false)
    }

    private async _archiveRequest<T>(query: string): Promise<T> {
        let response = await fetch(this.info().archive, {
            method: 'POST',
            body: JSON.stringify({query}),
            headers: {
                'content-type': 'application/json',
                'accept': 'application/json',
                'accept-encoding': 'gzip, br'
            }
        })
        if (!response.ok) {
            let body = await response.text()
            throw new Error(`Got http ${response.status}${body ? `, body: ${body}` : ''}`)
        }
        let result = await response.json()
        if (result.errors?.length) {
            throw new Error(`GraphQL error: ${result.errors[0].message}`)
        }
        return assertNotNull(result.data) as T
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

    private readJson<T>(name: string): T {
        let content = fs.readFileSync(this.item(name), 'utf-8')
        return JSON.parse(content)
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
    events: eac.Registry
    calls: eac.Registry
}


interface DecodedBlockEvents {
    blockNumber: number
    events: any[]
}


interface BlockEvents {
    blockNumber: number
    events: string
}
