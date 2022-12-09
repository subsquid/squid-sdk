import {Logger} from '@subsquid/logger'
import {CID, IPFS} from 'ipfs-core'


export interface IpfsCacheOptions {
    dir: string
    ipfs: IPFS
    log?: Logger
}


export class IpfsCache {
    public readonly dir: string
    private ipfs: IPFS
    private log?: Logger

    constructor(options: IpfsCacheOptions) {
        this.dir = options.dir
        this.ipfs = options.ipfs
        this.log = options.log
    }

    async put(cid: CID | string): Promise<void> {
        let stat = await this.ipfs.files.stat(cid)
        switch(stat.type) {

        }
    }
}
