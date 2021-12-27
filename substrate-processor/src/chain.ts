import {RpcClient} from "@subsquid/rpc-client"
import {JsonCodec} from "@subsquid/scale-codec"
import {
    ChainDescription,
    decodeMetadata,
    Field,
    getChainDescriptionFromMetadata,
    OldTypesBundle,
    QualifiedName,
    SpecVersion
} from "@subsquid/substrate-metadata"
import {getEvent, getEventHash} from "@subsquid/substrate-metadata/lib/event"
import {getTypesFromBundle} from "@subsquid/substrate-metadata/lib/old/typesBundle"
import {assertNotNull} from "@subsquid/util"
import assert from "assert"
import type {SubstrateEvent, SubstrateRuntimeVersion} from "./interfaces/substrate"


/**
 * Subset of SubstrateBlock properties required for getting
 * chain metadata for a given block
 */
interface BlockInfo {
    height: number
    hash: string
    parentHash: string
    runtimeVersion: SpecVersion | SubstrateRuntimeVersion
}


export class ChainManager {
    private versions = new Map<SpecVersion, {height: number, chain: Chain}>()

    constructor(
        private client: RpcClient,
        private typesBundle: OldTypesBundle = {types: {}}) {
    }

    async getChainForBlock(block: BlockInfo): Promise<Chain> {
        let specVersion = typeof block.runtimeVersion == 'number'
            ? block.runtimeVersion
            : block.runtimeVersion.specVersion

        let v = this.versions.get(specVersion)
        if (v != null && v.height < block.height) return v.chain

        let height = Math.max(0, block.height - 1)
        let hash = height > 0 ? block.parentHash : block.hash
        let rtv: SubstrateRuntimeVersion = await this.client.call('chain_getRuntimeVersion', [hash])
        v = this.versions.get(rtv.specVersion)
        if (v == null) {
            let metadataHex: string = await this.client.call('state_getMetadata', [hash])
            v = this.versions.get(rtv.specVersion) // perhaps it was fetched
            if (v == null) {
                let chain = this.createChain(rtv.specVersion, metadataHex)
                v = {chain, height}
                this.versions.set(rtv.specVersion, v)
            }
        }
        v.height = Math.min(v.height, height)
        return v.chain
    }

    private createChain(specVersion: SpecVersion, metadataHex: string): Chain {
        let metadata = decodeMetadata(metadataHex)
        let types = getTypesFromBundle(this.typesBundle, specVersion)
        let description = getChainDescriptionFromMetadata(metadata, types)
        return new Chain(description)
    }
}


export class Chain {
    private jsonCodec: JsonCodec

    constructor(
        public readonly description: ChainDescription
    ) {
        this.jsonCodec = new JsonCodec(description.types)
    }

    getEventHash(eventName: QualifiedName): string {
        return getEventHash(this.description, eventName)
    }

    decodeEvent(event: SubstrateEvent): any {
        let def = getEvent(this.description, event.name)
        if (def.fields.length == 0) return undefined
        if (def.fields[0].name == null) return this.decodeTuple(def.fields, event.params)
        let result: any = {}
        for (let i = 0; i < def.fields.length; i++) {
            let f = def.fields[i]
            let name = assertNotNull(f.name)
            result[name] = this.jsonCodec.decode(f.type, event.params[i].value)
        }
        return result
    }

    private decodeTuple(fields: Field[], values: {value: unknown}[]): any {
        if (fields.length == 1) {
            return this.jsonCodec.decode(fields[0].type, values[0].value)
        } else {
            assert(fields.length == values.length, 'invalid event data')
            let result: any[] = new Array(fields.length)
            for (let i = 0; i < fields.length; i++) {
                result[i] = this.jsonCodec.decode(fields[i].type, values[i].value)
            }
            return result
        }
    }
}
