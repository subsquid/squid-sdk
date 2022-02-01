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
import {xxhashAsU8a} from "@polkadot/util-crypto"

interface RuntimeVersion {
    specVersion: SpecVersion
}

type RawExtrinsic = string
type RawMetadata = string
type Spec = number

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

interface BlockEntity {
    id: string
    height: number
    hash: string
    parent_hash: string
    spec: Spec
    timestamp: number
}

interface LogEntity {
    name: string
    tip: BigInt
}

interface MetadataEntity {
    spec: Spec
    block_height: number
    block_hash: number
    data: string
}

function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1)
}

function getExtrinsicName(extrinsic: Extrinsic) {
    let section = extrinsic.call.__kind.toLowerCase() // TODO: switch to camelCase
    let method = extrinsic.call.value.__kind.split('_').reduce((memo: string, value: string, index: number) => {
        memo += index === 0 ? value : capitalize(value)
        return memo
    }, '')
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


async function main() {
    let client = new ResilientRpcClient("wss://rpc.polkadot.io")
    let blockHeight = 1463;

    while (true) {
        console.log(`Processing block at ${blockHeight}`)
        let blockHash = await client.call<string>("chain_getBlockHash", [blockHeight])
        let runtimeVersion = await client.call<RuntimeVersion>("chain_getRuntimeVersion", [blockHash])
        let signedBlock = await client.call<SignedBlock>("chain_getBlock", [blockHash])

        let typesBundle = getOldTypesBundle("polkadot")
        if (typesBundle) {
            let rawMetadata = await client.call<RawMetadata>("state_getMetadata", [blockHash])
            let metadata = decodeMetadata(rawMetadata)
            let oldTypes = getTypesFromBundle(typesBundle, runtimeVersion.specVersion)
            let description = getChainDescriptionFromMetadata(metadata, oldTypes)

            let storageKey = "0x" + Buffer.from([
                ...xxhashAsU8a("System", 128),
                ...xxhashAsU8a("Events", 128)
            ]).toString("hex")
            let rawEvents = await client.call("state_getStorageAt", [storageKey, blockHash])
            let codec = new Codec(description.types)
            let events = codec.decodeBinary(description.eventRecordList, rawEvents)

            let logEntities: LogEntity[] = []
            let extrinsics: Extrinsic[] = []
            signedBlock.block.extrinsics.forEach(extrinsic => {
                let decodedExtrinsic = decodeExtrinsic(extrinsic, description)
                extrinsics.push(decodedExtrinsic)
                let log = {
                    name: getExtrinsicName(decodedExtrinsic),
                    tip: decodedExtrinsic.signature?.tip || 0n
                }
                logEntities.push(log)
            })
            let blockEntity = {
                id: formatId(blockHeight, blockHash),
                height: blockHeight,
                hash: blockHash,
                parent_hash: signedBlock.block.header.parentHash,
                spec: runtimeVersion.specVersion,
                timestamp: getBlockTimestamp(extrinsics),
            }

            console.log(blockEntity)
            // console.log(logEntities)
        }
        blockHeight++
    }
}

main()
