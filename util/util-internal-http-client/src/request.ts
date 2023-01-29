import assert from 'assert'
import type {Headers, RequestInit, Response} from 'node-fetch'
import {esm} from '../esm'


export interface FetchRequest extends RequestInit {
    url: string
    headers: Headers
}


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
    async request(req: FetchRequest): Promise<Response> {
        let m = await nodeFetch.load()
        return m.default(req.url, req)
    }
}
