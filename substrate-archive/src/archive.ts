import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {Codec} from "@subsquid/scale-codec"
import {
    ChainDescription,
    decodeMetadata,
    Extrinsic,
    getChainDescriptionFromMetadata,
    getOldTypesBundle,
    OldTypes,
    OldTypesBundle,
    SpecVersion
} from "@subsquid/substrate-metadata"
import {getTypesFromBundle} from "@subsquid/substrate-metadata/lib/old/typesBundle"
import {assertNotNull, toCamelCase} from "@subsquid/util"
import * as pg from "pg"
import {
    BlockEntity,
    CallEntity,
    Event,
    EventEntity,
    ExtrinsicCall,
    ExtrinsicEntity,
    LastBlock,
    QualifiedName,
    RawMetadata,
    RuntimeVersion,
    SignedBlock,
    SpecInfo
} from "./model"
import {formatId, isPreV14, omit} from "./util"


function getQualifiedName(eventOrCall: ExtrinsicCall | Event): QualifiedName {
    let section = toCamelCase(eventOrCall.__kind)
    return `${section}.${eventOrCall.value.__kind}`
}


/**
 * All blocks have timestamp event except for the genesic block.
 * This method looks up `timestamp.set` and reads off the block timestamp
 *
 * @param extrinsics block extrinsics
 * @returns timestamp as set by a `timestamp.set` call
 */
function getBlockTimestamp(extrinsics: Extrinsic[]): number {
    let extrinsic = extrinsics.find(extrinsic => {
        if (extrinsic.call.__kind !== 'Timestamp') return false
        return extrinsic.call.value.__kind === 'set'
    })
    return extrinsic ? extrinsic.call.value.now : 0
}


export interface SubstrateArchiveOptions {
    client: ResilientRpcClient
    db: pg.ClientBase
    typesBundle?: OldTypesBundle
}


export class SubstrateArchive {
    private client: ResilientRpcClient
    private db: pg.ClientBase
    private typesBundle?: OldTypesBundle

    constructor(options: SubstrateArchiveOptions) {
        this.client = options.client
        this.db = options.db
        this.typesBundle = options.typesBundle
    }

    // async saveBlock(blockHeight: number, description: ChainDescription) {
    //     let blockHash = await this.client.call<string>("chain_getBlockHash", [blockHeight])
    //     let runtimeVersion = await this.client.call<RuntimeVersion>("chain_getRuntimeVersion", [blockHash])
    //     let signedBlock = await this.client.call<SignedBlock>("chain_getBlock", [blockHash])
    // }

    async run(): Promise<void> {
        let lastBlock = await this.getLastBlock()
        let blockHeight = lastBlock ? lastBlock.height + 1 : 1
        let specInfo: SpecInfo | undefined

        while (true) {
            console.log(`Processing block at ${blockHeight}`)
            let blockHash = await this.client.call<string>("chain_getBlockHash", [blockHeight])
            let runtimeVersion = await this.client.call<RuntimeVersion>("chain_getRuntimeVersion", [blockHash])
            let signedBlock = await this.client.call<SignedBlock>("chain_getBlock", [blockHash])

            if (lastBlock === undefined) {  // start indexing
                console.log('load metadata because start')
                specInfo = await this.getSpecInfo(blockHash, runtimeVersion.specVersion)
                await this.db.query(
                    "INSERT INTO metadata(spec_version, block_height, block_hash, hex) VALUES($1, $2, $3, $4)",
                    [specInfo.specVersion, blockHeight, blockHash, specInfo.rawMetadata]
                )
            } else if (specInfo === undefined) {  // resume indexing
                if (runtimeVersion.specVersion == lastBlock.specVersion) {
                    let lastBlockParentRuntimeVersion = await this.client.call<RuntimeVersion>("chain_getRuntimeVersion", [lastBlock.parent_hash])
                    if (lastBlockParentRuntimeVersion.specVersion != runtimeVersion.specVersion) {
                        console.log('load metadata because resume and change spec')
                        specInfo = await this.getSpecInfo(blockHash, runtimeVersion.specVersion)
                        await this.db.query(
                            "INSERT INTO metadata(spec_version, block_height, block_hash, hex) VALUES($1, $2, $3, $4)",
                            [runtimeVersion.specVersion, lastBlock.height, lastBlock.hash, specInfo.rawMetadata]
                        )
                    } else {
                        console.log('load metadata because resume')
                        specInfo = await this.getSpecInfo(blockHash, runtimeVersion.specVersion)
                    }
                } else {
                    specInfo = await this.getSpecInfo(lastBlock.hash, lastBlock.specVersion)
                }
            } else {
                if (specInfo.specVersion != runtimeVersion.specVersion && runtimeVersion.specVersion == lastBlock.specVersion) {
                    console.log('load metadata because change spec')
                    specInfo = await this.getSpecInfo(blockHash, runtimeVersion.specVersion)
                    await this.db.query(
                        "INSERT INTO metadata(spec_version, block_height, block_hash, hex) VALUES($1, $2, $3, $4)",
                        [specInfo.specVersion, lastBlock.height, lastBlock.hash, specInfo.rawMetadata]
                    )
                }
            }

            // let storageKey = "0x" + Buffer.from([
            //     ...xxhashAsU8a("System", 128),
            //     ...xxhashAsU8a("Events", 128)
            // ]).toString("hex")
            // let rawEvents = await this.client.call("state_getStorageAt", [storageKey, blockHash])
            // let codec = new Codec(specInfo.description.types)
            // let events = codec.decodeBinary(specInfo.description.eventRecordList, rawEvents)
            // let eventEntities: EventEntity[] = []
            let blockId = formatId(blockHeight, blockHash)
            // events.forEach((decodedEvent: any, index: number) => {
            //     let eventEntity = {
            //         id: formatId(blockHeight, blockHash, index),
            //         block_id: blockId,
            //         name: getQualifiedName(decodedEvent.event),
            //         args: decodedEvent.event.value.value,
            //     }
            //     eventEntities.push(eventEntity)
            // })

            // let extrinsics: Extrinsic[] = []
            // let extrinsicEntities: ExtrinsicEntity[] = []
            // let callEntities: CallEntity[] = []
            // signedBlock.block.extrinsics.forEach((extrinsic, index) => {
            //     let decodedExtrinsic = decodeExtrinsic(extrinsic, assertNotNull(specDescription).description)
            //     extrinsics.push(decodedExtrinsic)
            //     let extrinsicId = formatId(blockHeight, blockHash, index)
            //     let extrinsicEntity = {
            //         id: extrinsicId,
            //         block_id: blockId,
            //         name: getQualifiedName(decodedExtrinsic.call),
            //         tip: decodedExtrinsic.signature?.tip || 0n,
            //         nonce: decodedExtrinsic.signature?.nonce || 0,
            //         hash: decodedExtrinsic.hash,
            //     }
            //     extrinsicEntities.push(extrinsicEntity)
            //     if (decodedExtrinsic.call.__kind == "Utility" && decodedExtrinsic.call.value.__kind == "batch") {
            //         decodedExtrinsic.call.value.calls.forEach((call: any) => {
            //             let callEntity = {
            //                 extrinsic_id: extrinsicId,
            //                 args: omit(call.value, "__kind"),
            //             }
            //             callEntities.push(callEntity)
            //         })
            //     } else {
            //         let callEntity = {
            //             extrinsic_id: extrinsicId,
            //             args: omit(decodedExtrinsic.call.value, "__kind"),
            //         }
            //         callEntities.push(callEntity)
            //     }
            // })

            // let blockEntity = {
            //     id: blockId,
            //     height: blockHeight,
            //     hash: blockHash,
            //     parent_hash: signedBlock.block.header.parentHash,
            //     timestamp: getBlockTimestamp(extrinsics),
            // }

            await this.tx(async () => {
                await this.db.query(
                    "INSERT INTO block(id, height, hash, parent_hash, timestamp) VALUES($1, $2, $3, $4, $5)",
                    [blockId, blockHeight, blockHash, signedBlock.block.header.parentHash, new Date()]
                )
            })
            // try {
            //     await this.db.query("BEGIN")
            //     await this.db
            //     let queries: Promise<any>[] = []
            //     queries.push(
            //         db.query(
            //             "INSERT INTO block(id, height, hash, parent_hash, timestamp) VALUES($1, $2, $3, $4, $5)",
            //             Object.values(blockEntity)
            //         )
            //     )
            //     extrinsicEntities.forEach(extrinsicEntity => {
            //         queries.push(
            //             db.query(
            //                 "INSERT INTO extrinsic(id, block_id, name, tip, nonce, hash) VALUES($1, $2, $3, $4, $5, $6)",
            //                 Object.values(extrinsicEntity),
            //             )
            //         )
            //     })
            //     callEntities.forEach(callEntity => {
            //         queries.push(
            //             db.query(
            //                 "INSERT INTO call(extrinsic_id, args) VALUES($1, $2)",
            //                 Object.values(callEntity)
            //             )
            //         )
            //     })
            //     eventEntities.forEach(eventEntity => {
            //         queries.push(
            //             db.query(
            //                 "INSERT INTO event(id, block_id, name, args) VALUES($1, $2, $3, $4)",
            //                 Object.values(eventEntity)
            //             )
            //         )
            //     })
            //     await Promise.all(queries)
            //     await db.query("COMMIT")
            // } catch (e) {
            //     await db.query("ROLLBACK")
            //     throw e
            // }

            lastBlock = {
                id: blockId,
                height: blockHeight,
                hash: blockHash,
                parent_hash: signedBlock.block.header.parentHash,
                timestamp: new Date(),
                specVersion: runtimeVersion.specVersion
            }
            blockHeight++
        }
    }

    private async getSpecInfo(
        blockHash: string,
        specVersion?: number
    ): Promise<SpecInfo> {
        if (specVersion == null) {
            let rt = await this.client.call<RuntimeVersion>('chain_getRuntimeVersion', [blockHash])
            specVersion = rt.specVersion
        }
        let rawMetadata = await this.client.call<RawMetadata>("state_getMetadata", [blockHash])
        let metadata = decodeMetadata(rawMetadata)
        let oldTypes: OldTypes | undefined
        if (isPreV14(metadata)) {
            oldTypes = getTypesFromBundle(assertNotNull(this.typesBundle), specVersion)
        }
        let description = getChainDescriptionFromMetadata(metadata, oldTypes)
        return {
            description,
            rawMetadata,
            specVersion
        }
    }

    private async getLastBlock(): Promise<LastBlock | undefined> {
        let res = await this.db.query<BlockEntity>("SELECT * FROM block ORDER BY height DESC LIMIT 1")
        if (res.rows.length == 0) return undefined
        let blockEntity = res.rows[0]
        let runtimeVersion = await this.client.call<RuntimeVersion>("chain_getRuntimeVersion", [blockEntity.hash])
        return {...blockEntity, specVersion: runtimeVersion.specVersion}
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
