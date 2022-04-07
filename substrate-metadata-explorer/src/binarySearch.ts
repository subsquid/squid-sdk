import type {Log, SpecVersion} from "./types"


export interface SearchOptions {
    firstBlock: number
    lastBlock: number
    fetch: (heights: number[]) => Promise<SpecVersion[]>
    log?: Log
}


export async function findSpecVersions(options: SearchOptions): Promise<SpecVersion[]> {
    let {fetch, log} = options
    let queue: [beg: SpecVersion, end: SpecVersion][] = []
    let versions = new Map<string, SpecVersion>()

    function add(v: SpecVersion): void {
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
        log?.(`step: ${step}, versions known so far: ${versions.size}`)

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


function equalSpecs(a: SpecVersion, b: SpecVersion): boolean {
    return a.specName == b.specName && a.specVersion == b.specVersion
}
