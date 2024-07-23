import {S3Client} from '@aws-sdk/client-s3'
import {Fs} from './interface'
import {LocalFs} from './local'
import {S3Fs} from './s3'
import {EventEmitter} from 'events'


export function createFs(url: string, eventEmitter?: EventEmitter): Fs {
    if (url.includes('://')) {
        let protocol = new URL(url).protocol
        switch(protocol) {
            case 's3:':
                return createS3Fs(url.slice('s3://'.length), eventEmitter)
            default:
                throw new Error(`Unsupported protocol: ${protocol}`)
        }
    } else {
        return new LocalFs(url)
    }
}


function createS3Fs(root: string, eventEmitter?: EventEmitter): S3Fs {
    let client = new S3Client({
        endpoint: process.env.AWS_S3_ENDPOINT
    })
    return new S3Fs({
        root,
        client,
        eventEmitter
    })
}
