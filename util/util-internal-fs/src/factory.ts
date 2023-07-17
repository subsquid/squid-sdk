import {S3Client} from '@aws-sdk/client-s3'
import {Fs} from './interface'
import {LocalFs} from './local'
import {S3Fs} from './s3'


export function createFs(url: string): Fs {
    if (url.includes('://')) {
        let protocol = new URL(url).protocol
        switch(protocol) {
            case 's3:':
                return createS3Fs(url.slice('s3://'.length))
            default:
                throw new Error(`Unsupported protocol: ${protocol}`)
        }
    } else {
        return new LocalFs(url)
    }
}


function createS3Fs(root: string): S3Fs {
    let client = new S3Client({
        region: process.env.AWS_DEFAULT_REGION,
        endpoint: process.env.AWS_S3_ENDPOINT
    })
    return new S3Fs({
        root,
        client
    })
}
