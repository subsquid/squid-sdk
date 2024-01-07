import type {Writable} from 'stream'
import {ensureError} from './misc'


export function waitDrain(out: Writable): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!out.writableNeedDrain) return resolve()

        if (!out.writable) {
            return reject(new Error('output stream is no longer writable'))
        }

        function cleanup() {
            out.removeListener('error', error)
            out.removeListener('drain', drain)
        }

        function drain() {
            cleanup()
            resolve()
        }

        function error(err: any) {
            cleanup()
            reject(ensureError(err))
        }

        out.on('drain', drain)
        out.on('error', error)
    })
}
