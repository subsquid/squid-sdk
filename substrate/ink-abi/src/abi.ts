import {Codec as ScaleCodec, Src} from "@subsquid/scale-codec"
import {Ti} from "@subsquid/substrate-metadata"
import {AbiDescription, SelectorsMap} from "./abi-description"
import {getInkProject} from "./metadata/validator"


export class Abi {
    private scaleCodec: ScaleCodec
    private event: Ti
    private messages: Ti
    private constructors: Ti
    private messageSelectors: SelectorsMap
    private constructorSelectors: SelectorsMap

    constructor(abiJson: unknown) {
        let project = getInkProject(abiJson)
        let d = new AbiDescription(project)
        let types = d.types()

        this.scaleCodec = new ScaleCodec(types)
        this.event = d.event()
        this.messages = d.messages()
        this.constructors = d.constructors()
        this.messageSelectors = d.messageSelectors()
        this.constructorSelectors = d.constructorSelectors()
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
