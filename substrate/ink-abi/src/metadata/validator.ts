import Ajv from "ajv"
import schema from "./ink-v3-schema.json"
import {InkProject, MetadataVersioned} from "./interfaces"


const ajv = new Ajv({
    messages: true,
    removeAdditional: false
})


ajv.addFormat('uint8', function (data: number | string): boolean {
    return uint(data) && data < Math.pow(2, 8)
})


ajv.addFormat('uint32', function (data: number | string): boolean {
    return uint(data) && data < Math.pow(2, 32)
})


ajv.addFormat('uint64', uint)


function uint(data: number | string): data is number {
    return typeof data == 'number' && Number.isSafeInteger(data) && data >= 0
}


const validator = ajv.compile<MetadataVersioned>(schema)


export function getInkProject(abi: unknown): InkProject {
    if (validator(abi)) {
        if ('V3' in abi) {
            return abi.V3
        } else {
            throw new Error(`Only V3 Ink metadata is supported`)
        }
    } else {
        let msg = `Invalid Ink metadata`
        if (validator.errors?.length) {
            msg += ':'
            validator.errors.forEach(err => {
                msg += `\n\tmetadata${err.instancePath} ${err.message}`
            })
        }
        throw new Error(msg)
    }
}
