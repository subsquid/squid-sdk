import {StorageType} from './interfaces'
import {ByteSink, Sink} from '../codeс/sink'
import {toHex} from '@subsquid/util-internal-hex'
import {Elementary, encodeElementary} from '../codeс'

export function padKey(keyType: StorageType, key: any) {
    let type: Elementary

    if (keyType.label.startsWith('enum')) {
        type = keyType.label.slice(0, 3) as 'enum'
    } else if (keyType.label.startsWith('contract')) {
        type = keyType.label.slice(0, 7) as 'contract'
    } else {
        type = keyType.label as Elementary
    }

    if (type === 'string' || type === 'bytes') {
    } else {
        let sink = new ByteSink()
        encodeElementary(type, key, sink)

        let bytes = sink.toBytes()
        if (bytes.length < 32) {
            let t = bytes
            bytes = new Uint8Array(32)
            bytes.set(t, 32 - t.length)
        }

        return toHex(bytes)
    }
}
