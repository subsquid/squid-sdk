import {createReadStream} from 'fs'
import * as fs from 'fs/promises'
import * as Path from 'path'
import {Readable} from 'stream'
import {Fs} from './interface'


export class LocalFs implements Fs {
    private root: string

    constructor(root: string, private tx = true) {
        this.root = Path.resolve(root)
    }

    abs(...path: string[]): string {
        return Path.resolve(this.root, ...path)
    }

    cd(...path: string[]): LocalFs {
        return new LocalFs(this.abs(...path))
    }

    ls(...path: string[]): Promise<string[]> {
        return fs.readdir(this.abs(...path)).catch(err => {
            if (err.code == 'ENOENT') {
                return []
            } else {
                throw err
            }
        })
    }

    async transactDir(path: string, cb: (fs: LocalFs) => Promise<void>): Promise<void> {
        let targetDir = this.abs(path)
        let tmpPrefix = Path.join(Path.dirname(targetDir), `temp--${Path.basename(targetDir)}--`)
        await ensureDir(tmpPrefix)
        let tmpDir = await fs.mkdtemp(tmpPrefix)
        try {
            await cb(new LocalFs(tmpDir, false))
            await fs.rename(tmpDir, targetDir)
        } catch(err: any) {
            await fs.rm(tmpDir, {recursive: true, force: true}).catch(() => {})
            throw err
        }
    }

    async write(path: string, content: Readable | Uint8Array | string): Promise<void> {
        let target = this.abs(path)
        await ensureDir(target)
        if (this.tx) {
            let tmp = Path.join(Path.dirname(target), `temp--${Date.now()}--${Path.basename(target)}`)
            try {
                await fs.writeFile(tmp, content)
                await fs.rename(tmp, target)
            } catch(err: any) {
                await fs.rm(tmp, {recursive: true, force: true}).catch(() => {})
                throw err
            }
        } else {
            await fs.writeFile(target, content)
        }
    }

    delete(path: string): Promise<void> {
        let item = this.abs(path)
        return fs.rm(item, {
            recursive: true,
            force: true
        })
    }

    async readStream(path: string): Promise<Readable> {
        let item = this.abs(path)
        return createReadStream(item)
    }

    async readFile(path: string): Promise<Uint8Array>
    async readFile(path: string, encoding: BufferEncoding): Promise<string>
    async readFile(path: string, encoding?: BufferEncoding): Promise<Uint8Array | string> {
        let item = this.abs(path)
        return fs.readFile(item)
    }
}


function ensureDir(path: string) {
    return fs.mkdir(Path.dirname(path), {recursive: true})
}
