import {SpecVersionRecord} from "./specVersion"


export interface SearchOptions {
    firstBlock: number
    lastBlock: number
    fetch: (heights: number[]) => Promise<SpecVersionRecord[]>
    progress?: (info: {step: number, versions: number}) => void
}


export async function findSpecVersions(options: SearchOptions): Promise<SpecVersionRecord[]> {
    let {fetch, progress} = options
    let queue: [beg: SpecVersionRecord, end: SpecVersionRecord][] = []
    let versions = new Map<string, SpecVersionRecord>()

    function add(v: SpecVersionRecord): void {
        versions.set(`${v.specName}@${v.specVersion}`, v)
    }

    let [beg, end] = await fetch([options.firstBlock, options.lastBlock])

    add(beg)
    if (!equalSpecs(beg, end)) {
        add(end)
        queue.push([beg, end])
    }

    let step = 0
    while (queue.length) {
        let batch = queue.slice(0, 20)
        queue = queue.slice(20)

        step += 1
        progress?.({step, versions: versions.size})

        let heights = batch.map(([b, e]) => b.blockNumber + Math.floor((e.blockNumber - b.blockNumber) / 2))
        let newVersions = await fetch(heights)
        batch.forEach(([b, e], idx) => {
            let m = newVersions[idx]
            if (!equalSpecs(b, m)) {
                add(m)
            }
            if (!equalSpecs(b, m) && m.blockNumber - b.blockNumber > 1) {
                queue.push([b, m])
            }
            if (!equalSpecs(m, e) && e.blockNumber - m.blockNumber > 1) {
                queue.push([m, e])
            }
        })
    }

    return Array.from(versions.values()).sort((a, b) => a.blockNumber - b.blockNumber)
}


function equalSpecs(a: SpecVersionRecord, b: SpecVersionRecord): boolean {
    return a.specName == b.specName && a.specVersion == b.specVersion
}
