import assert from 'assert'
import type {RequestInit, Response} from 'node-fetch'
import {esm} from '../esm'


let mod: typeof import('node-fetch') | undefined


export const nodeFetch = {
    async load(): Promise<typeof import('node-fetch')> {
        if (mod) return mod
        return mod = await esm<typeof import('node-fetch') >('node-fetch')
    },
    get Headers() {
        assert(mod, 'node-fetch ESM is not loaded')
        return mod.Headers
    },
    get FetchError() {
        assert(mod, 'node-fetch ESM is not loaded')
        return mod.FetchError
    },
    async request(url: string, init?: RequestInit): Promise<Response> {
        let m = await nodeFetch.load()
        return m.default(url, init)
    }
}
