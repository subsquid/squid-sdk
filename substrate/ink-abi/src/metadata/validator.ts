import Ajv, {ValidateFunction} from "ajv"
import schemaV3 from "./v3/ink-v3-schema.json"
import schemaV4 from "./v4/ink-v4-schema.json"
import {InkProject as InkProjectV3, MetadataVersioned} from "./v3/interfaces"
import {InkProject as InkProjectV4} from "./v4/interfaces"


export type InkProject = InkProjectV3 | InkProjectV4


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


const validatorV3 = ajv.compile<MetadataVersioned>(schemaV3)
const validatorV4 = ajv.compile<InkProjectV4>(schemaV4)


function isAbiV4(abi: unknown): boolean {
    return typeof abi === 'object' && abi !== null && (abi as any).version == 4
}


function makeError<T>(validator: ValidateFunction<T>): Error {
    let msg = `Invalid Ink metadata`
    if (validator.errors?.length) {
        msg += ':'
        validator.errors.forEach(err => {
            msg += `\n\tmetadata${err.instancePath} ${err.message}`
        })
    }
    return new Error(msg)
}


export function getInkProject(abi: unknown): InkProject {
    if (isAbiV4(abi)) {
        if (validatorV4(abi)) {
            return abi
        } else {
            throw makeError(validatorV4)
        }
    } else {
        if (validatorV3(abi)) {
            if ('V3' in abi) {
                return abi.V3
            } else {
                throw new Error(`Ink metadata below V3 is not supported`)
            }
        } else {
            throw makeError(validatorV3)
        }
    }
}
