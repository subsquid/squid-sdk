import {Codec, GetCodecType} from './codec'
import {Sink} from './sink'
import {Src} from './src'


export type GetStructType<Props> = {
    [K in keyof Props]: GetCodecType<Props[K]>
}


export class StructCodec<Props extends Record<string, Codec<any>>> implements Codec<GetStructType<Props>> {
    private staticSize?: number
    private headSize: number

    constructor(
        public readonly props: Props
    ) {
        this.staticSize = 0
        for (let key in props) {
            let size = props[key].getStaticSize()
            if (size == null) {
                this.staticSize = undefined
                break
            } else {
                this.staticSize += size
            }
        }

        this.headSize = 0
        for (let key in props) {
            this.headSize += props[key].getStaticSize() ?? 1
        }
    }

    getStaticSize(): number | undefined {
        return this.staticSize
    }

    encode(sink: Sink, val: GetStructType<Props>): void {
        if (this.staticSize == null) {
            this.encodeDynamic(sink, val)
        } else {
            this.encodeStatic(sink, val)
        }
    }

    private encodeDynamic(sink: Sink, val: GetStructType<Props>): void {
        let start = sink.getPosition()
        let tail = start + this.headSize * 32
        for (let key in this.props) {
            let codec = this.props[key]
            let size = codec.getStaticSize()
            if (size == null) {
                sink.u32(tail - start)
                let head = sink.getPosition()
                sink.setPosition(tail)
                codec.encode(sink, val[key])
                tail = sink.getPosition()
                sink.setPosition(head)
            } else {
                codec.encode(sink, val[key])
            }
        }
        sink.setPosition(tail)
    }

    private encodeStatic(sink: Sink, val: GetStructType<Props>): void {
        for (let key in this.props) {
            this.props[key].encode(sink, val[key])
        }
    }

    decode(src: Src): GetStructType<Props> {
        if (this.headSize == null) {
            return this.decodeDynamic(src)
        } else {
            return this.decodeStatic(src)
        }
    }

    private decodeDynamic(src: Src): GetStructType<Props> {
        let result: any = {}
        let start = src.getPosition()
        for (let key in this.props) {
            let codec = this.props[key]
            if (codec.getStaticSize() == null) {
                let ptr = src.u32()
                let head = src.getPosition()
                src.setPosition(start + ptr)
                result[key] = codec.decode(src)
                src.setPosition(head)
            } else {
                result[key] = codec.decode(src)
            }
        }
        return result
    }

    private decodeStatic(src: Src): GetStructType<Props> {
        let result: any = {}
        for (let key in this.props) {
            result[key] = this.props[key].decode(src)
        }
        return result
    }
}
