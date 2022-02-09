import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {Codec} from "@subsquid/scale-codec"
import {
    decodeExtrinsic,
    decodeMetadata,
    getChainDescriptionFromMetadata,
    OldTypes,
    OldTypesBundle
} from "@subsquid/substrate-metadata"
import * as eac from "@subsquid/substrate-metadata/lib/events-and-calls"
import {getTypesFromBundle} from "@subsquid/substrate-metadata/lib/old/typesBundle"
import {assertNotNull, def, toCamelCase} from "@subsquid/util"
import * as pg from "pg"
import {CallParser} from "./callParser"
import {SpecInfo, sub} from "./interfaces"
import {Event, Extrinsic} from "./model"
import {blake2bHash, EVENT_STORAGE_KEY, formatId, isPreV14, omit} from "./util"


export interface SubstrateArchiveOptions {
    client: ResilientRpcClient
    db: pg.ClientBase
    typesBundle?: OldTypesBundle
}


export class SubstrateArchive {
    private client: ResilientRpcClient
    private db: pg.ClientBase
    private typesBundle?: OldTypesBundle
    private _specInfo?: SpecInfo

    constructor(options: SubstrateArchiveOptions) {
        this.client = options.client
        this.db = options.db
        this.typesBundle = options.typesBundle
    }

    async *loop() {
        let lastHeight = await this.getLastHeight()
        let block = lastHeight ? lastHeight + 1 : 1
        await this.initSpecInfo(block)

        while (true) {
            yield await this.processBlock(block)
            block += 1
        }
    }

    private async processBlock(blockHeight: number): Promise<void> {
        let metadataToSave: SpecInfo | undefined
        let blockHash = await this.client.call<string>("chain_getBlockHash", [blockHeight])
        let runtimeVersion = await this.client.call<sub.RuntimeVersion>("chain_getRuntimeVersion", [blockHash])
        let specInfo = assertNotNull(this._specInfo)
        if (specInfo.specVersion != runtimeVersion.specVersion) {
            this._specInfo = await this.getSpecInfo(blockHash, runtimeVersion.specVersion)
            metadataToSave = this._specInfo
        }

        let signedBlock = await this.client.call<sub.SignedBlock>("chain_getBlock", [blockHash])
        let rawEvents = await this.client.call("state_getStorageAt", [EVENT_STORAGE_KEY, blockHash])

        let block_id = formatId(blockHeight, blockHash)
        let events: Event[] = specInfo.scaleCodec.decodeBinary(specInfo.description.eventRecordList, rawEvents)
            .map((e: sub.EventRecord, idx: number) => {
                let name = toCamelCase(e.event.__kind) + '.' + e.event.value.__kind
                let args: unknown
                let def = assertNotNull(specInfo.events.definitions[name])
                if (def.fields[0]?.name != null) {
                    args = omit(e.event.value, '__kind')
                } else {
                    args = e.event.value.value
                }
                let extrinsic_id: string | undefined
                if (e.phase.__kind == 'ApplyExtrinsic') {
                    extrinsic_id = formatId(blockHeight, blockHash, e.phase.value)
                }
                return {
                    id: formatId(blockHeight, blockHash, idx),
                    block_id,
                    phase: e.phase.__kind,
                    index_in_block: idx,
                    name,
                    args,
                    extrinsic_id
                }
            })

        let extrinsics: (Extrinsic & {args: unknown})[] = signedBlock.block.extrinsics
            .map((hex, idx) => {
                let bytes = Buffer.from(hex.slice(2), 'hex')
                let hash = blake2bHash(bytes, 32)
                let ex = decodeExtrinsic(bytes, specInfo.description, specInfo.scaleCodec)
                let call: sub.Call = ex.call
                let name = toCamelCase(call.__kind) + '.' + call.value.__kind
                let args: unknown
                let def = assertNotNull(specInfo.calls.definitions[name])
                if (def.fields[0]?.name != null) {
                    args = omit(call.value, '__kind')
                } else {
                    args = call.value.value
                }
                return {
                    id: formatId(blockHeight, blockHash, idx),
                    block_id,
                    index_in_block: idx,
                    name,
                    signature: ex.signature,
                    success: true,
                    hash,
                    args
                }
            })

        let calls = new CallParser(events, extrinsics).calls

        await this.tx(async () => {
            if (metadataToSave) {
                await this.saveMetadata(blockHeight, blockHash, metadataToSave)
            }
        })
    }

    private async initSpecInfo(blockHeight: number) {
        let blockHash = await this.client.call<string>("chain_getBlockHash", [blockHeight])
        let header = await this.client.call<sub.BlockHeader>("chain_getHeader", [blockHash])
        this._specInfo = await this.getSpecInfo(header.parentHash)
    }

    private async getLastHeight(): Promise<number | undefined> {
        let res = await this.db.query("SELECT height FROM block ORDER BY height DESC LIMIT 1")
        if (res.rowCount) {
            return res.rows[0].height
        }
    }

    private saveMetadata(blockHeight: number, blockHash: string, specInfo: SpecInfo): Promise<unknown> {
        return this.db.query(
            "INSERT INTO metadata(spec_version, block_height, block_hash, hex) VALUES($1, $2, $3, $4)",
            [specInfo.specVersion, blockHeight, blockHash, specInfo.rawMetadata]
        )
    }

    private async getSpecInfo(
        blockHash: string,
        specVersion?: number
    ): Promise<SpecInfo> {
        if (specVersion == null) {
            let rt = await this.client.call<sub.RuntimeVersion>('chain_getRuntimeVersion', [blockHash])
            specVersion = rt.specVersion
        }
        let rawMetadata: string = await this.client.call("state_getMetadata", [blockHash])
        let metadata = decodeMetadata(rawMetadata)
        let oldTypes: OldTypes | undefined
        if (isPreV14(metadata)) {
            oldTypes = getTypesFromBundle(assertNotNull(this.typesBundle), specVersion)
        }
        let description = getChainDescriptionFromMetadata(metadata, oldTypes)
        return {
            description,
            rawMetadata,
            specVersion,
            scaleCodec: new Codec(description.types),
            events: new eac.Registry(description.types, description.event),
            calls: new eac.Registry(description.types, description.call)
        }
    }

    private async tx<T>(cb: () => Promise<T>): Promise<T> {
        await this.db.query('BEGIN')
        try {
            let result = await cb()
            await this.db.query('COMMIT')
            return result
        } catch(e: any) {
            await this.db.query('ROLLBACK').catch(() => {})
            throw e
        }
    }
}
