import assert from 'assert'
import {decodeHex} from '@subsquid/util-internal-hex'
import {StorageType} from './interfaces'
import {Elementary, decodeElementary, encodeElementary, HexSink, Src} from './codec'

export function padKey(keyType: StorageType, key: any) {
    let sink = new HexSink()

    switch (keyType.label) {
        case 'bytes': {
            let bytes = typeof key === 'string' ? decodeHex(key) : key
            sink.bytes(bytes)
            break
        }
        case 'string': {
            sink.str(key)
            break
        }
        default: {
            let type = normalizeElementaryType(keyType.label)
            encodeElementary(type, key, sink)
            sink.bytes(new Uint8Array(32 - Number(keyType.numberOfBytes))) // left-pad with zeros.
            assert(sink.length == 32)
        }
    }

    return sink.toHex()
}

export function decodeValue(valType: StorageType, val: string | Uint8Array, offset: number) {
    let src = new Src(val)
    assert(src.length == 32)

    if (valType.label === 'string' || valType.label === 'bytes') {
        let lenByte = src.u8()

        if (lenByte % 2 === 0) {
            // bytes are stored in slot
            let length = lenByte / 2
            src.skip(31 - length) // skip zeros

            switch (valType.label) {
                case 'bytes':
                    return src.bytes(length)
                case 'string':
                    return src.str(length)
            }
        } else {
            // only length is stored in slot
            src.skip(-1) // move cursor back

            return decodeElementary('uint', src)
        }
    } else {
        src.skip(offset)

        let type = normalizeElementaryType(valType.label)
        return decodeElementary(type, src)
    }
}

function normalizeElementaryType(str: string): Elementary {
    let type: Elementary

    if (str.startsWith('enum')) {
        type = str.slice(0, 3) as 'enum'
    } else if (str.startsWith('contract')) {
        type = str.slice(0, 7) as 'contract'
    } else {
        type = str as Elementary
    }

    return type
}
