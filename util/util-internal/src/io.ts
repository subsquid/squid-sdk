import type {Writable} from 'stream'
import {ensureError} from './misc'


export function waitDrain(out: Writable): Promise<void> {
    return new Promise((resolve, reject) => {
        // https://github.com/nodejs/node/issues/42610
        if (!out.writable || out.destroyed || out.errored || out.writableEnded) {
            return reject(new Error('output stream is no longer writable'))
        }

        if (!out.writableNeedDrain) return resolve()

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
