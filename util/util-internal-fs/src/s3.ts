import {
    DeleteObjectsCommand,
    ListObjectsV2Command,
    ObjectIdentifier,
    PutObjectCommand,
    S3Client
} from '@aws-sdk/client-s3'
import assert from 'assert'
import {Readable} from 'stream'
import Upath from 'upath'
import {Fs} from './interface'


export interface S3FsOptions {
    root: string
    client: S3Client
}


export class S3Fs implements Fs {
    public readonly client: S3Client
    private root: string

    constructor(options: S3FsOptions) {
        this.client = options.client
        this.root = Upath.normalizeTrim(options.root)
        splitPath(this.root)
    }

    abs(...path: string[]): string {
        return 's3://' + this.resolve(path)
    }

    private resolve(path: string[]): string {
        let root = this.root
        for (let seg of path) {
            if (seg[0] == '/') {
                root = seg
            } else {
                root = Upath.join(root, seg)
            }
        }
        root = Upath.normalizeTrim(root)
        if (root[0] == '/') {
            root = root.slice(1)
        }
        splitPath(root)
        return root
    }

    cd(...path: string[]): S3Fs {
        return new S3Fs({
            client: this.client,
            root: this.resolve(path)
        })
    }

    async ls(...path: string[]): Promise<string[]> {
        let [Bucket, Prefix] = splitPath(this.resolve(path))
        if (Prefix) {
            Prefix += '/'
        }

        let names = new Set<string>()
        let ContinuationToken: string | undefined

        while (true) {
            let res = await this.client.send(
                new ListObjectsV2Command({
                    Bucket,
                    Prefix,
                    Delimiter: '/',
                    ContinuationToken
                })
            )

            // process folder names
            if (res.CommonPrefixes) {
                for (let CommonPrefix of res.CommonPrefixes) {
                    if (CommonPrefix.Prefix) {
                        let name = CommonPrefix.Prefix.slice(Prefix.length, CommonPrefix.Prefix.length - 1)
                        names.add(name)
                    }
                }
            }

            // process file names
            if (res.Contents) {
                for (let Content of res.Contents) {
                    if (Content.Key && Content.Key != Prefix) {
                        let fileName = Content.Key.slice(Prefix.length)
                        names.add(fileName)
                    }
                }
            }

            if (res.IsTruncated) {
                ContinuationToken = res.NextContinuationToken
            } else {
                break
            }
        }

        return Array.from(names).sort()
    }

    transactDir(path: string, cb: (fs: Fs) => Promise<void>): Promise<void> {
        return cb(this.cd(path))
    }

    async write(path: string, content: Readable | Uint8Array | string): Promise<void> {
        let [Bucket, Key] = splitPath(this.resolve([path]))
        await this.client.send(new PutObjectCommand({
            Bucket,
            Key,
            Body: content
        }))
    }

    async delete(path: string): Promise<void> {
        let [Bucket, Key] = splitPath(this.resolve([path]))
        let ContinuationToken: string | undefined
        while (true) {
            let list = await this.client.send(
                new ListObjectsV2Command({
                    Bucket,
                    Prefix: Key,
                    ContinuationToken
                })
            )

            if (list.Contents) {
                let Objects: ObjectIdentifier[] = []
                for (let Content of list.Contents) {
                    if (!Content.Key) continue
                    if (Content.Key === Key || Content.Key.startsWith(Key + '/')) {
                        Objects.push({Key: Content.Key})
                    }
                }
                Objects.length && await this.client.send(new DeleteObjectsCommand({
                    Bucket,
                    Delete: {
                        Objects
                    }
                }))
            }

            if (list.IsTruncated) {
                ContinuationToken = list.NextContinuationToken
            } else {
                break
            }
        }
    }
}


function splitPath(path: string): [bucket: string, prefix: string] {
    let parts = path.split('/')
    let bucket = parts[0]
    assert(/^[a-z0-9\-_]+$/i.test(bucket), 'Valid S3 path should begin with a bucket')
    return [bucket, parts.slice(1).join('/')]
}
