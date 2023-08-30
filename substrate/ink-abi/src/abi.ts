import {Codec as ScaleCodec, Src, ByteSink, Ti} from '@subsquid/scale-codec'
import {AbiDescription, SelectorsMap} from "./abi-description"
import {getInkProject, InkProject} from "./metadata/validator"
import {decodeHex} from "@subsquid/util-internal-hex"
import assert from "assert"


export class Abi {
    private scaleCodec: ScaleCodec
    private event: Ti
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
        this.event = d.event()
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

    decodeMessageOutput<T=any>(selector: string, value: Uint8Array): T {
        let message = this.getMessage(selector)
        assert(message.returnType?.type != null)
        return this.scaleCodec.decodeBinary(message.returnType.type, value)
    }

    decodeEvent<T=any>(data: string): T {
        return this.scaleCodec.decodeBinary(this.event, data)
    }

    decodeConstructor<T=any>(data: string): T {
        let src = new SelectorSource(data, this.constructorSelectors)
        return this.scaleCodec.decode(this.constructors, src)
    }

    decodeMessage<T=any>(data: string): T {
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
