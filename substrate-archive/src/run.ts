// @ts-nocheck
import { RpcClient } from "@subsquid/rpc-client"
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
    let section = extrinsic.call.__kind.toLowerCase()
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

// type BlockHash = string

// class SubstrateService {
//     private client: RpcClient

//     constructor(url: string) {
//         this.client = new RpcClient(url)
//     }

//     async getBlockHash(): Promise<BlockHash> {
//         return this.client.call<BlockHash>("chain_getBlockHash")
//     }
// }

async function main() {
    // let client = new RpcClient("wss://kusama-rpc.polkadot.io")
    let client = new RpcClient("wss://rpc.polkadot.io")
    let blockHeight = 1;
    // let blockHeight = 3876;
    // let blockHeight = 10000123;
    // let blockNumber = 10000119; // decode error

    let lastSpecVersion = null
    // let lastDescription = null
    let description: ChainDescription
    let updateMetadata = false

    while (true) {
        console.log(`Processing block at ${blockHeight}`)
        let blockHash = await client.call<string>("chain_getBlockHash", [blockHeight])
        let runtimeVersion = await client.call<RuntimeVersion>("chain_getRuntimeVersion", [blockHash])
        let signedBlock = await client.call<SignedBlock>("chain_getBlock", [blockHash])

        let typesBundle = getOldTypesBundle("polkadot")
        if (typesBundle) {
            if (lastSpecVersion != null) {
                if (lastSpecVersion != runtimeVersion.specVersion) {
                    console.log(lastSpecVersion, runtimeVersion.specVersion)
                    throw 'error'
                    updateMetadata = true
                } else {
                    if (updateMetadata) {
                        let rawMetadata = await client.call<RawMetadata>("state_getMetadata", [blockHash])
                        let metadata = decodeMetadata(rawMetadata)
                        let oldTypes = getTypesFromBundle(typesBundle, runtimeVersion.specVersion)
                        description = getChainDescriptionFromMetadata(metadata, oldTypes)
                        updateMetadata = false
                    }
                }
            } else {
                let rawMetadata = await client.call<RawMetadata>("state_getMetadata", [blockHash])
                let metadata = decodeMetadata(rawMetadata)
                console.log('call metadata')
                let oldTypes = getTypesFromBundle(typesBundle, runtimeVersion.specVersion)
                description = getChainDescriptionFromMetadata(metadata, oldTypes)
            }
            lastSpecVersion = runtimeVersion.specVersion

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
                height: blockHeight,
                hash: blockHash,
                parent_hash: signedBlock.block.header.parentHash,
                spec: runtimeVersion.specVersion,
                timestamp: getBlockTimestamp(extrinsics),
            }

            console.log(blockEntity)
            console.log(logEntities)
        }
        blockHeight++
        // break
    }
    client.close()
}

main()
