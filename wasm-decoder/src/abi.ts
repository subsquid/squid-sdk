import {AbiEvent, AbiMessage, DecodedEvent, DecodedMessage} from "./interfaces"
import {normalizeTypes} from "./utils"
import {Codec, Src, Type} from "@subsquid/scale-codec"
import {normalizeMetadataTypes} from "@subsquid/substrate-metadata/lib/util"
import assert from "assert"


export class Abi {
    public readonly types: Type[]
    private readonly codec: Codec
    constructor(private abiJson: Record<string, any>) {
        assert(abiJson.V3 != null, 'Only version 3 is supported')
        let types = normalizeTypes(abiJson.V3.types)
        types = normalizeMetadataTypes(types)
        this.types = types
        this.codec = new Codec(types)
    }

    decodeEvent(data: string): DecodedEvent {
        let src = new Src(data)
        let index = src.u8()
        let event: AbiEvent = this.abiJson.V3.spec.events[index]
        return {
            args: event.args.map(arg => this.codec.decode(arg.type.type, src)),
            event,
        }
    }

    decodeConstructor(data: string): DecodedMessage {
        return this._decodeMessage(this.abiJson.V3.spec.constructors, data)
    }

    decodeMessage(data: string): DecodedMessage {
        return this._decodeMessage(this.abiJson.V3.spec.messages, data)
    }

    private _decodeMessage(messages: AbiMessage[], data: string): DecodedMessage {
        let selector = data.slice(0, 10)
        let message = messages.find(message => message.selector == selector)
        assert(message != null, `Unable to find a message with selector ${selector}`)
        let buf = Buffer.from(data.slice(10), 'hex')
        let src = new Src(buf)
        return {
            args: message.args.map(arg => this.codec.decode(arg.type.type, src)),
            message,
        }
    }
}
