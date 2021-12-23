import {Log, SpecVersion} from "./types"


export interface Version {
    specVersion: SpecVersion
    blockNumber: number
    blockHash: string
}


export class Explorer {
    private queue: [beg: Version, end: Version][] = []
    private versions = new Map<SpecVersion, Version>()

    private constructor(
        private first: number,
        private last: number,
        private fetch: (heights: number[]) => Promise<Version[]>,
        private log?: Log
    ) {
    }

    private add(v: Version): void {
        this.versions.set(v.specVersion, v)
    }

    private async explore() {
        let [beg, end] = await this.fetch([this.first, this.last])

        this.add(beg)
        if (beg.specVersion != end.specVersion) {
            this.add(end)
            this.queue.push([beg, end])
        }

        let step = 0
        while (this.queue.length) {
            let batch = this.queue.slice(0, 20)
            this.queue = this.queue.slice(20)

            step += 1
            this.log?.(`step: ${step}, versions known so far: ${this.versions.size}`)

            let heights = batch.map(([b, e]) => b.blockNumber + Math.floor((e.blockNumber - b.blockNumber) / 2))
            let versions = await this.fetch(heights)
            batch.forEach(([b, e], idx) => {
                let m = versions[idx]
                if (b.specVersion != m.specVersion) {
                    this.add(m)
                }
                if (b.specVersion != m.specVersion && m.blockNumber - b.blockNumber > 1) {
                    this.queue.push([b, m])
                }
                if (m.specVersion != e.specVersion && e.blockNumber - m.blockNumber > 1) {
                    this.queue.push([m, e])
                }
            })
        }
    }

    static async getVersions(
        firstBlock: number,
        lastBlock: number,
        fetch: (heights: number[]) => Promise<Version[]>,
        log?: Log
    ): Promise<Version[]> {
        let explorer = new Explorer(firstBlock, lastBlock, fetch, log)
        await explorer.explore()
        return Array.from(explorer.versions.values()).sort((a, b) => a.blockNumber - b.blockNumber)
    }
}
