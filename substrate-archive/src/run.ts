import assert from "assert"
import { ResilientRpcClient } from "@subsquid/rpc-client/lib/resilient"
import {
    decodeMetadata,
    decodeExtrinsic,
    getChainDescriptionFromMetadata,
    getOldTypesBundle,
    SpecVersion,
    Extrinsic,
    ChainDescription,
} from "@subsquid/substrate-metadata"
import {Codec} from "@subsquid/scale-codec"
import {getTypesFromBundle} from "@subsquid/substrate-metadata/lib/old/typesBundle"
import {toCamelCase} from "@subsquid/util"
import {xxhashAsU8a} from "@polkadot/util-crypto"
import {getConnection} from "./db"

interface RuntimeVersion {
    specVersion: SpecVersion
}

type RawExtrinsic = string
type RawMetadata = string
type Spec = number
type QualifiedName = string

interface BlockHeader {
    parentHash: string
}

interface Block {
    header: BlockHeader
    extrinsics: RawExtrinsic[]
}

interface SignedBlock {
    block: Block
}

interface BlockEntity {  // TODO: rename/remove entity postfix
    id: string
    height: number
    hash: string
    parent_hash: string
    timestamp: number
}

interface ExtrinsicEntity {
    id: string
    block_id: string
    name: string
    tip: BigInt
}

interface CallEntity {
    extrinsic_id: string
    args: object
}

interface MetadataEntity {
    spec: Spec
    block_height: number
    block_hash: number
    data: string
}

interface SpecDescription {
    spec: SpecVersion
    description: ChainDescription
}


interface LastBlock extends BlockEntity {
    spec: SpecVersion
}


function getQualifiedName(extrinsic: Extrinsic): QualifiedName {
    let section = toCamelCase(extrinsic.call.__kind)
    let method = extrinsic.call.value.__kind
    return `${section}.${method}`
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


export const BLOCK_PAD_LENGTH = 10
export const INDEX_PAD_LENGTH = 6
export const HASH_PAD_LENGTH = 5


/**
 * Formats the event id into a fixed-lentgth string. When formatted the natural string ordering
 * is the same as the ordering
 * in the blockchain (first ordered by block height, then by block ID)
 *
 * @return  id in the format 000000..00<blockNum>-000<index>-<shorthash>
 *
 */
function formatId(height: number, hash: string, index?: number): string {
    const blockPart = `${String(height).padStart(BLOCK_PAD_LENGTH, '0')}`
    const indexPart =
      index !== undefined
        ? `-${String(index).padStart(INDEX_PAD_LENGTH, '0')}`
        : ''
    const _hash = hash.startsWith('0x') ? hash.substring(2) : hash
    const shortHash =
      _hash.length < HASH_PAD_LENGTH
        ? _hash.padEnd(HASH_PAD_LENGTH, '0')
        : _hash.slice(0, HASH_PAD_LENGTH)
    return `${blockPart}${indexPart}-${shortHash}`
}


export function assertNotNull<T>(val: T | undefined | null, msg?: string): T {
    assert(val != null, msg)
    return val
}


function omit(obj: any, ...keys: string[]): any {
    let copy = {...obj}
    keys.forEach(key => {
        delete copy[key]
    })
    return copy
}


async function main() {
    let client = new ResilientRpcClient("wss://kusama-rpc.polkadot.io")
    let db = await getConnection()
    let blockHeight = 10000123;

    let specDescription: SpecDescription | undefined
    let lastBlock: LastBlock | undefined
    if (blockHeight != 1) {
        let res = await db.query<BlockEntity>("SELECT * FROM block ORDER BY height LIMIT 1")  // potential problem with forks
        let blockEntity = res.rows[0]
        let runtimeVersion = await client.call<RuntimeVersion>("chain_getRuntimeVersion", [blockEntity.hash])
        lastBlock = {...blockEntity, spec: runtimeVersion.specVersion}
    }
    while (true) {
        console.log(`Processing block at ${blockHeight}`)
        let blockHash = await client.call<string>("chain_getBlockHash", [blockHeight])
        let runtimeVersion = await client.call<RuntimeVersion>("chain_getRuntimeVersion", [blockHash])
        let signedBlock = await client.call<SignedBlock>("chain_getBlock", [blockHash])
        let header = await client.call("chain_getHeader", [blockHash])  // TODO: decode block author

        let typesBundle = assertNotNull(getOldTypesBundle("kusama"))
        if (lastBlock === undefined) {  // start indexing
            let rawMetadata = await client.call<RawMetadata>("state_getMetadata", [blockHash])
            let metadata = decodeMetadata(rawMetadata)
            let oldTypes = getTypesFromBundle(typesBundle, runtimeVersion.specVersion)
            let description = getChainDescriptionFromMetadata(metadata, oldTypes)
            specDescription = {spec: runtimeVersion.specVersion, description}

            let metadataEntity = {
                spec: runtimeVersion.specVersion,
                block_height: blockHeight,
                block_hash: blockHash,
                data: rawMetadata,
            }
            await db.query(
                "INSERT INTO metadata(spec, block_height, block_hash, data) VALUES($1, $2, $3, $4)",
                Object.values(metadataEntity)
            )
        } else if (specDescription === undefined) {  // resume indexing
            if (runtimeVersion.specVersion == lastBlock.spec) {
                let rawMetadata = await client.call<RawMetadata>("state_getMetadata", [blockHash])
                let metadata = decodeMetadata(rawMetadata)
                let oldTypes = getTypesFromBundle(typesBundle, runtimeVersion.specVersion)
                let description = getChainDescriptionFromMetadata(metadata, oldTypes)
                specDescription = {spec: runtimeVersion.specVersion, description}
            } else {
                let rawMetadata = await client.call<RawMetadata>("state_getMetadata", [lastBlock.hash])
                let metadata = decodeMetadata(rawMetadata)
                let oldTypes = getTypesFromBundle(typesBundle, lastBlock.spec)
                let description = getChainDescriptionFromMetadata(metadata, oldTypes)
                specDescription = {spec: lastBlock.spec, description}

                let metadataEntity = {
                    spec: lastBlock.spec,
                    block_height: lastBlock.height,
                    block_hash: lastBlock.hash,
                    data: rawMetadata,
                }
                await db.query(
                    "INSERT INTO metadata(spec, block_height, block_hash, data) VALUES($1, $2, $3, $4)",
                    Object.values(metadataEntity)
                )
            }
        } else {
            if (specDescription.spec != runtimeVersion.specVersion && runtimeVersion.specVersion == lastBlock.spec) {
                let rawMetadata = await client.call<RawMetadata>("state_getMetadata", [lastBlock.hash])
                let metadata = decodeMetadata(rawMetadata)
                let oldTypes = getTypesFromBundle(typesBundle, lastBlock.spec)
                let description = getChainDescriptionFromMetadata(metadata, oldTypes)
                specDescription = {spec: lastBlock.spec, description}

                let metadataEntity = {
                    spec: lastBlock.spec,
                    block_height: lastBlock.height,
                    block_hash: lastBlock.hash,
                    data: rawMetadata,
                }
                await db.query(
                    "INSERT INTO metadata(spec, block_height, block_hash, data) VALUES($1, $2, $3, $4)",
                    Object.values(metadataEntity)
                )
            }
        }

        let storageKey = "0x" + Buffer.from([
            ...xxhashAsU8a("System", 128),
            ...xxhashAsU8a("Events", 128)
        ]).toString("hex")
        let rawEvents = await client.call("state_getStorageAt", [storageKey, blockHash])
        let codec = new Codec(specDescription.description.types)
        let events = codec.decodeBinary(specDescription.description.eventRecordList, rawEvents)

        let extrinsics: Extrinsic[] = []
        let extrinsicEntities: ExtrinsicEntity[] = []
        let blockId = formatId(blockHeight, blockHash)
        let callEntities: CallEntity[] = []
        signedBlock.block.extrinsics.forEach((extrinsic, index) => {
            let decodedExtrinsic = decodeExtrinsic(extrinsic, assertNotNull(specDescription).description)
            extrinsics.push(decodedExtrinsic)
            let extrinsicId = formatId(blockHeight, blockHash, index)
            let extrinsicEntity = {
                id: extrinsicId,
                block_id: blockId,
                name: getQualifiedName(decodedExtrinsic),
                tip: decodedExtrinsic.signature?.tip || 0n,
            }
            extrinsicEntities.push(extrinsicEntity)
            if (decodedExtrinsic.call.__kind == "Utility" && decodedExtrinsic.call.value.__kind == "batch") {
                decodedExtrinsic.call.value.calls.forEach((call: any) => {
                    let callEntity = {
                        extrinsic_id: extrinsicId,
                        args: omit(call.value, "__kind"),
                    }
                    callEntities.push(callEntity)
                })
            } else {
                let callEntity = {
                    extrinsic_id: extrinsicId,
                    args: omit(decodedExtrinsic.call.value, "__kind"),
                }
                callEntities.push(callEntity)
            }
        })

        let blockEntity = {
            id: blockId,
            height: blockHeight,
            hash: blockHash,
            parent_hash: signedBlock.block.header.parentHash,
            timestamp: getBlockTimestamp(extrinsics),
        }

        // is there more than one query to db?
        try {
            await db.query("BEGIN")
            let queries: Promise<any>[] = []
            queries.push(
                db.query(
                    "INSERT INTO block(id, height, hash, parent_hash, timestamp) VALUES($1, $2, $3, $4, $5)",
                    Object.values(blockEntity)
                )
            )
            extrinsicEntities.forEach(extrinsicEntity => {
                queries.push(
                    db.query(
                        "INSERT INTO extrinsic(id, block_id, name, tip) VALUES($1, $2, $3, $4)",
                        Object.values(extrinsicEntity),
                    )
                )
            })
            callEntities.forEach(callEntity => {
                queries.push(
                    db.query(
                        "INSERT INTO call(extrinsic_id, args) VALUES($1, $2)",
                        Object.values(callEntity)
                    )
                )
            })
            await Promise.all(queries)
            await db.query("COMMIT")
        } catch (e) {
            await db.query("ROLLBACK")
            throw e
        }

        // TODO: disconnect from db
        lastBlock = {...blockEntity, spec: runtimeVersion.specVersion}
        blockHeight++
    }
}

main()
