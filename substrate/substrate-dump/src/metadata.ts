import {Bytes, runtimeVersionEquals, RuntimeVersionId} from '@subsquid/substrate-data-raw'
import {def} from '@subsquid/util-internal'
import {formatBlockNumber} from '@subsquid/util-internal-archive-layout'
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

    async save(version: MetadataVersion, metadata: () => Promise<Bytes>): Promise<void> {
        let versions = await this.versions()
        if (isStored(versions, version)) return
        let gz = zlib.gzipSync(decodeHex(await metadata()))
        await this.fs.write(printMetadataVersion(version) + '.gz', gz)
        versions.push(version)
    }
}


function isStored(versions: RuntimeVersionId[], v: RuntimeVersionId): boolean {
    for (let i = versions.length - 1; i >= 0; i--) {
        if (runtimeVersionEquals(versions[i], v)) return true
    }
    return false
}
