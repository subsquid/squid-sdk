import {BlockData, runtimeVersionEquals, RuntimeVersionId} from '@subsquid/substrate-raw-data'
import {def} from '@subsquid/util-internal'
import {formatBlockNumber, getShortHash} from '@subsquid/util-internal-archive-layout'
import {Fs} from '@subsquid/util-internal-fs'
import {decodeHex} from '@subsquid/util-internal-hex'
import {basename} from 'path'
import * as zlib from 'zlib'


export interface MetadataVersion {
    specName: string
    specVersion: number
    implName: string
    implVersion: number
    blockHeight: number
    blockHash: string
}


export function printMetadataVersion(v: MetadataVersion): string {
    return `${formatBlockNumber(v.blockHeight)}-${v.blockHash}--${v.specName}@${v.specVersion}--${v.implName}@${v.implVersion}`
}


export function tryParseMetadataVersion(s: string): MetadataVersion | undefined {
    let m = /^(\d+)-([\da-f]+)--(\w+)@(\d+)--(\w+)@(\d+)$/.exec(s)
    if (!m) return
    return {
        blockHeight: parseInt(m[1]),
        blockHash: m[2],
        specName: m[3],
        specVersion: parseInt(m[4]),
        implName: m[5],
        implVersion: parseInt(m[6])
    }
}


export class MetadataWriter {
    constructor(private fs: Fs) {}

    @def
    private async versions(): Promise<MetadataVersion[]> {
        let versions: MetadataVersion[] = []
        for (let item of await this.fs.ls()) {
            let v = tryParseMetadataVersion(basename(item, '.gz'))
            if (v) versions.push(v)
        }
        return versions
    }

    async stripAndSaveMetadata(blocks: BlockData[]): Promise<void> {
        let versions = await this.versions()
        for (let block of blocks) {
            if (block.runtimeVersion == null || block.metadata == null) continue
            if (!isStored(versions, block.runtimeVersion)) {
                let newVersion: MetadataVersion = {
                    specName: block.runtimeVersion.specName,
                    specVersion: block.runtimeVersion.specVersion,
                    implName: block.runtimeVersion.implName,
                    implVersion: block.runtimeVersion.implVersion,
                    blockHeight: block.height,
                    blockHash: getShortHash(block.hash)
                }
                let gz = zlib.gzipSync(decodeHex(block.metadata))
                await this.fs.write(printMetadataVersion(newVersion) + '.gz', gz)
                versions.push(newVersion)
            }
            block.metadata = undefined
        }
    }
}


function isStored(versions: RuntimeVersionId[], v: RuntimeVersionId): boolean {
    for (let i = versions.length - 1; i >= 0; i--) {
        if (runtimeVersionEquals(versions[i], v)) return true
    }
    return false
}
