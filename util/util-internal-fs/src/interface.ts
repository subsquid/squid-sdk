import type {Readable} from 'stream'


export interface Fs {
    cd(...path: string[]): Fs
    abs(...path: string[]): string
    ls(...path: string[]): Promise<string[]>
    transactDir(path: string, cb: (fs: Fs) => Promise<void>): Promise<void>
    /**
     * Note, that this method is not supposed to take ownership over `Readable`
     */
    write(path: string, content: Readable | Uint8Array | string): Promise<void>
}
