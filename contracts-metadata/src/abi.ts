import assert from "assert"
import {Codec, Src, Type} from "@subsquid/scale-codec"
import schema from "./schema/ink-v3-schema.json"
import {MetadataVersioned, InkProject} from "./schema/interfaces"
import {DecodedEvent, DecodedMessage, AbiEvent, AbiContructor, AbiMessage} from "./interfaces"
import {makeValidator, printValidationErrors, normalizePortableTypes} from "./util"


const validateMetadata = makeValidator<MetadataVersioned>(schema as any);


export class Abi {
    readonly events: AbiEvent[]
    readonly constructors: AbiContructor[]
    readonly messages: AbiMessage[]
    readonly types: Type[]
    private readonly codec: Codec
    constructor(abiJson: Record<string, unknown>) {
        let metadata = {V3: abiJson['V3'] as unknown as InkProject}
        if (!validateMetadata(metadata)) {
            throw new Error(`The metadata isn't valid:\n  ${printValidationErrors(validateMetadata, '\n  ')}`)
        }
        this.events = metadata.V3.spec.events.map(event => ({
            ...event,
            args: event.args.map(arg => ({...arg, type: arg.type.type}))
        }))
        this.constructors = metadata.V3.spec.constructors.map(constructor => ({
            ...constructor,
            args: constructor.args.map(arg => ({...arg, type: arg.type.type}))
        }))
        this.messages = metadata.V3.spec.messages.map(message => ({
            ...message,
            args: message.args.map(arg => ({...arg, type: arg.type.type}))
        }))
        this.types = normalizePortableTypes(metadata.V3.types)
        this.codec = new Codec(this.types)
    }

    decodeEvent(data: string): DecodedEvent {
        let src = new Src(data)
        let index = src.u8()
        let event = this.events[index]
        return {
            args: event.args.map(arg => this.codec.decode(arg.type, src)),
            event,
        }
    }

    decodeConstructor(data: string): DecodedMessage {
        return this._decodeMessage('constructor', this.constructors, data)
    }

    decodeMessage(data: string): DecodedMessage {
        return this._decodeMessage('message', this.messages, data)
    }

    private _decodeMessage(type: 'constructor' | 'message', messages: AbiMessage[], data: string): DecodedMessage {
        let selector = data.slice(0, 10)
        let message = messages.find(message => message.selector == selector)
        assert(message != null, `Unable to find a ${type} with selector ${selector}`)
        let buf = Buffer.from(data.slice(10), 'hex')
        let src = new Src(buf)
        return {
            args: message.args.map(arg => this.codec.decode(arg.type, src)),
            message,
        }
    }
}
