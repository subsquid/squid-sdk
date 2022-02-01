// @ts-nocheck
import {Codec, Src} from "@subsquid/scale-codec"
import {ChainDescription} from "./chainDescription"
import {Extrinsic} from "./interfaces"

const BIT_SIGNED = 0b10000000;

export function decodeExtrinsic(rawExtrinsic: string, description: ChainDescription): Extrinsic {
    let data = Buffer.from(rawExtrinsic.slice(2), 'hex')
    let src = new Src(data)
    let codec = new Codec(description.types)

    src.compact()
    let signed = (src.u8() & BIT_SIGNED) == BIT_SIGNED
    if (signed) {
        let signature = codec.decode(description.signature, src)
        let palletIndex = src.u8()
        codec.types[description.call].variants.forEach((variant) => {
            if (variant.index == palletIndex) {
                let callIndex = src.u8()
                let call = variant.fields[callIndex]
                let len = src.compact()
                for (let index = 0; index < len; index++) {
                    let childPalletIndex = src.u8()
                    let childVariant = codec.types[description.call].variants[childPalletIndex]
                    let variantIndex = src.u8() // 0
                    let childType = codec.types[childVariant.fields[0].type]

                    // name: 'bond',
                    // fields: [
                    //   { name: 'controller', type: 34 },
                    //   { name: 'value', type: 64 },
                    //   { name: 'payee', type: 121 }
                    // ],
                    let bond = childType.variants[variantIndex]
                    bond.fields.forEach((field, index) => {
                        console.log('field', field)
                        if (index == 1) {
                            // field "value"
                            console.log('res', codec.decode(field.type, src)) // error
                            // console.log('res', src.compact()) // no error
                        } else {
                            let res = codec.decode(field.type, src) // check type 64
                            console.log('res', res)
                        }
                    })

                    throw 'error'
                }
            }
        })
        return {
            signature,
            call: codec.decode(description.call, src),
        }
    } else {
        return {
            call: codec.decode(description.call, src),
        }
    }
}
