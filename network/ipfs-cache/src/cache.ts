import {Logger} from '@subsquid/logger'
import {unexpectedCase} from '@subsquid/util-internal'
import * as fs from 'fs/promises'
import {CID, IPFS} from 'ipfs-core'
import {base58btc} from 'multiformats/bases/base58'
import * as Path from 'path'
import {Writable} from 'stream'


export interface IpfsCacheOptions {
    dir: string
    ipfs: IPFS
    log?: Logger
}


export class IpfsCache {
    public readonly dir: string
    private ipfs: IPFS
    private log?: Logger
    private downloading = new Map<string, Promise<void>>() // path -> Download promise

    constructor(options: IpfsCacheOptions) {
        this.dir = options.dir
        this.ipfs = options.ipfs
        this.log = options.log
    }

    async put(cid: CID): Promise<void> {
        let path = this.path(cid)
        if (await fs.access(path).then(() => true, () => false)) return
        let promise = this.downloading.get(path)
        if (promise == null) {
            promise = this.download(cid).finally(() => this.downloading.delete(path))
            this.downloading.set(path, promise)
        }
        await promise
    }

    private async download(cid: CID): Promise<void> {
        this.log?.info(`downloading ${getCidPresentation(cid)}`)
        let stat = await this.ipfs.files.stat(cid)
        let path = this.path(cid)
        let temp = path + '.temp'
        await fs.mkdir(Path.dirname(path), {recursive: true})
        switch(stat.type) {
            case 'directory': {
                await fs.rm(temp, {recursive: true, force: true})
                await fs.mkdir(temp)
                for await (let item of this.ipfs.files.ls(cid)) {
                    await this.put(item.cid)
                    await fs.symlink('../../' + this.location(item.cid), Path.join(temp, item.name))
                    this.log?.info(`linked ${getCidPresentation(cid)}/${item.name} -> ${this.location(item.cid)}`)
                }
                break
            }
            case 'file': {
                let fd = await fs.open(temp, 'w')
                try {
                    let sink = Writable.toWeb(fd.createWriteStream())
                    let writer = sink.getWriter()
                    for await (let chunk of this.ipfs.files.read(cid)) {
                        await writer.write(chunk)
                    }
                    await writer.close()
                } finally {
                    await fd.close()
                }
                break
            }
            default:
                throw unexpectedCase(stat.type)
        }
        await fs.rename(temp, path)
        this.log?.info(`downloaded ${getCidPresentation(cid)}`)
    }

    path(cid: CID): string {
        return Path.join(this.dir, this.location(cid))
    }

    private location(cid: CID): string {
        let name = getCidPresentation(cid)
        let parent = name.slice(name.length - 2).toUpperCase()
        return parent + '/' + name
    }
}


export function getCidPresentation(cid: CID): string {
    return cid.toV1().toString(base58btc)
}
