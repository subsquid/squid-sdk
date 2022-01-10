import {Codec} from "./codec"
import {Registry} from "./registry"
import reg from "./ss58-registry.json"

export * from "@subsquid/ss58-codec"
export * from "./registry"
export const registry = new Registry(reg.registry)

export function codec(networkOrPrefix: number | string): Codec {
    let prefix = typeof networkOrPrefix == 'string' ? registry.get(networkOrPrefix).prefix : networkOrPrefix
    return new Codec(prefix)
}

export {Codec}
