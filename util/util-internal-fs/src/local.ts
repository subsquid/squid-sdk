import * as fs from 'fs/promises'
import * as Path from 'path'
import {Readable} from 'stream'
import {Fs} from './interface'


export class LocalFs implements Fs {
    private root: string

    constructor(root: string) {
        this.root = Path.resolve(root)
    }

    abs(...path: string[]): string {
        return Path.resolve(this.root, ...path)
    }

    cd(...path: string[]): LocalFs {
        return new LocalFs(this.abs(...path))
    }

    ls(...path: string[]): Promise<string[]> {
        return fs.readdir(this.abs(...path))
    }

    async transactDir(path: string, cb: (fs: LocalFs) => Promise<void>): Promise<void> {
        let targetDir = this.abs(path)
        let tmpPrefix = Path.join(Path.dirname(targetDir), `temp--${Path.basename(targetDir)}`)
        let tmpDir = await fs.mkdtemp(tmpPrefix)
        try {
            await cb(this.cd(tmpDir))
            await fs.rename(tmpDir, targetDir)
        } finally {
            await fs.rm(tmpDir, {recursive: true, force: true})
        }
    }

    async write(path: string, content: Readable | Uint8Array | string): Promise<void> {
        let target = this.abs(path)
        await fs.writeFile(target, content)
    }

    delete(path: string): Promise<void> {
        let item = this.abs(path)
        return fs.rm(item, {
            recursive: true,
            force: true
        })
    }
}
