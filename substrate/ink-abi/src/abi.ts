import {ByteSink, Codec as ScaleCodec, Src, Ti} from '@subsquid/scale-codec'
import {decodeHex} from '@subsquid/util-internal-hex'
import assert from 'assert'
import {AbiDescription, AbiEvent, Bytes, SelectorsMap} from './abi-description'
import {getInkProject, InkProject} from './metadata/validator'


export class Abi {
    private scaleCodec: ScaleCodec
    private events: AbiEvent[]
    private messages: Ti
    private constructors: Ti
    private messageSelectors: SelectorsMap
    private constructorSelectors: SelectorsMap
    private project: InkProject

    constructor(abiJson: unknown) {
        this.project = getInkProject(abiJson)
        let d = new AbiDescription(this.project)
        let types = d.types()

        this.scaleCodec = new ScaleCodec(types)
        this.events = d.events()
        this.messages = d.messages()
        this.constructors = d.constructors()
        this.messageSelectors = d.messageSelectors()
        this.constructorSelectors = d.constructorSelectors()
    }

    encodeMessageInput(selector: string, args: any[]): Uint8Array {
        let message = this.getMessage(selector)
        let sink = new ByteSink()
        sink.bytes(decodeHex(selector))
        for (let i = 0; i < message.args.length; i++) {
            let arg = message.args[i];
            this.scaleCodec.encode(arg.type.type, args[i], sink)
        }
        return sink.toBytes()
    }

    decodeMessageOutput<T=any>(selector: string, value: Uint8Array | Bytes): T {
        let message = this.getMessage(selector)
        assert(message.returnType?.type != null)
        return this.scaleCodec.decodeBinary(message.returnType.type, value)
    }

    decodeEvent<T=any>(data: Uint8Array | Bytes, topics?: Bytes[]): T {
        if (this.project.version == 5) {
            assert(topics, 'Topics are required if ink! contract is version 5')
            return this.decodeEventV5(data, topics)
        } else {
            return this.decodeEventV4(data)
        }
    }

    decodeEventV4(data: Uint8Array | Bytes) {
        let src = new Src(data)
        let idx = src.u8()
        let event = this.events[idx]

        if (!event) {
            throw new Error(`Unable to find event with index ${idx}`);
        }

        return {
            __kind: event.name,
            ...this.scaleCodec.decode(event.type, src)
        }
    }

    decodeEventV5(data: Uint8Array | Bytes, topics: Bytes[]) {
        let topic = topics[0]
        if (topic) {
            let event = this.events.find(e => e.signatureTopic == topic)
            if (event) {
                return {
                    __kind: event.name,
                    ...this.scaleCodec.decodeBinary(event.type, data)
                }
            }
        }

        let amountOfTopics = topics.length
        let potentialEvents = this.events.filter(e => {
            // event can't have a signature topic
            if (e.signatureTopic) {
                return false
            }
            // event should have same amount of indexed fields as emitted topics
            return amountOfTopics == e.amountIndexed
        })

        if (potentialEvents.length == 1) {
            let event = potentialEvents[0]
            return {
                __kind: event.name,
                ...this.scaleCodec.decodeBinary(event.type, data)
            }
        }

        throw new Error('Unable to determine event')
    }

    decodeConstructor<T=any>(data: Bytes): T {
        let src = new SelectorSource(data, this.constructorSelectors)
        return this.scaleCodec.decode(this.constructors, src)
    }

    decodeMessage<T=any>(data: Bytes): T {
        let src = new SelectorSource(data, this.messageSelectors)
        return this.scaleCodec.decode(this.messages, src)
    }

    private getMessage(selector: string) {
        let index = this.messageSelectors[selector]
        if (index == null) {
            throw new Error(`Unknown selector: ${selector}`)
        }
        return this.project.spec.messages[index]
    }
}


class SelectorSource extends Src {
    private index?: number

    constructor(data: string, selectors: SelectorsMap) {
        let key = data.slice(0, 10)
        let index = selectors[key]
        if (index == null) {
            throw new Error(`Unknown selector: ${key}`)
        }
        super('0x' + data.slice(10))
        this.index = index
    }

    u8(): number {
        if (this.index == null) {
            return super.u8()
        } else {
            let idx = this.index
            this.index = undefined
            return idx
        }
    }
}
