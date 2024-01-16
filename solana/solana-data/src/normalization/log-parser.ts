import {Base58Bytes} from '../base'


interface TokenBase {
    message: string
}


interface InvokeToken extends TokenBase {
    kind: 'invoke'
    programId: Base58Bytes
    stackHeight: number
}


interface InvokeResult extends TokenBase {
    kind: 'invoke-result'
    programId: Base58Bytes
    success: boolean
}


interface Message extends TokenBase {
    kind: 'message'
}


export type Token = InvokeToken | InvokeResult | Message


export function toToken(message: string): Token {
    let m = /^Program ([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+) invoke \[(\d+)]$/.exec(message)
    if (m) return {
        kind: 'invoke',
        programId: m[1],
        stackHeight: parseInt(m[2]),
        message
    }

    m = /^Program ([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+) success$/.exec(message)
    if (m) return {
        kind: 'invoke-result',
        programId: m[1],
        success: true,
        message
    }

    m = /^Program ([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+) failed/.exec(message)
    if (m) return {
        kind: 'invoke-result',
        programId: m[1],
        success: false,
        message
    }

    return {
        kind: 'message',
        message
    }
}


export interface LogItem {
    programId: Base58Bytes
}
