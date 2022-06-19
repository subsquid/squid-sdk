import {Logger} from "@subsquid/logger"
import {last} from "@subsquid/util-internal"
import {Out} from "./out"
import {SpecVersion, SpecVersionRecord} from "./specVersion"


export interface ExploreApi {
    getVersionRecords(fromBlock?: number): Promise<SpecVersionRecord[]>
    getVersionRecord(blockNumber: number): Promise<SpecVersionRecord | undefined>
    getSingleVersionRecord(): Promise<SpecVersionRecord | undefined>
    getVersion(rec: SpecVersionRecord): Promise<SpecVersion>
}


export async function explore(api: ExploreApi, out: Out, log?: Logger): Promise<void> {
    let knownVersions = out.knownVersions()
    if (knownVersions.length > 0) {
        log?.info('output file already has explored versions')
    }

    let matched = 0
    for (let known of knownVersions) {
        log?.info(`checking ${known.specName}@${known.specVersion} block ${known.blockNumber} against current chain`)
        let current = await api.getVersionRecord(known.blockNumber)
        if (known.blockHash === current?.blockHash) {
            matched += 1
        } else {
            log?.info('record mismatch')
            break
        }
    }

    let newVersions: SpecVersionRecord[]
    if (matched > 0) {
        if (matched != knownVersions.length) {
            for (let t of knownVersions.slice(matched)) {
                log?.info(`removing ${t.specName}@${t.specVersion} block ${t.blockNumber})`)
            }
            knownVersions = knownVersions.slice(0, matched)
            out.write(knownVersions)
        }
        let lastKnown = last(knownVersions)
        log?.info(`exploring chain from block ${lastKnown.blockNumber}`)
        newVersions = (await api.getVersionRecords(lastKnown.blockNumber)).slice(1)
        log?.info(`${newVersions.length} new version${newVersions.length == 1 ? '' : 's'} found`)
    } else if (knownVersions.length == 0) {
        log?.info(`exploring chain from block 0`)
        newVersions = await api.getVersionRecords()
        log?.info(`${newVersions.length} version${newVersions.length == 1 ? '' : 's'} found`)
    } else {
        // Let's assume it is an exploration of local dev runtime.
        // It has single spec version.
        // It's spec version number is strictly greater, than that of a production chain,
        // or it has a different spec name.
        // It is also possible, that last known version has the same spec id.
        // In such case we assume, that last known version is related to prev local runtime and erase it.
        let lastKnown = last(knownVersions)
        let newVersion = await api.getSingleVersionRecord()
        if (
            newVersion == null ||
            (newVersion.specName == lastKnown.specName && lastKnown.specVersion > newVersion.specVersion)
        ) {
            throw new Error(`Output file already contains data for a different chain, don't know how to proceed.`)
        }
        if (newVersion.specName == lastKnown.specName && newVersion.specVersion == lastKnown.specVersion) {
            log?.info(`replacing metadata for ${lastKnown.specName}@${lastKnown.specVersion}, assuming it came from dev runtime`)
            knownVersions = knownVersions.slice()
            knownVersions.pop()
            out.write(knownVersions)
        }
        newVersions = [newVersion]
    }

    for (let rec of newVersions) {
        let v = await api.getVersion(rec)
        out.append([v])
        log?.info(`saved ${rec.specName}@${rec.specVersion} block ${rec.blockNumber}`)
    }
}
