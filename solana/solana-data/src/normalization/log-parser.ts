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
    success: boolean
}


interface Message extends TokenBase {
    kind: 'message'
}


type Token = InvokeToken | InvokeResult | Message


function toToken(msg: string): Token {
    throw new Error()
}
