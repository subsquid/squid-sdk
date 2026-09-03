import assert from 'assert'
import {it} from 'vitest'
import {RemoteError, serializeError} from './error'


// Mirrors `@subsquid/http-client`'s `HttpResponse`/`HttpError`: an `HttpError`
// carries a `response` whose `headers` is a `Headers` instance. `Headers` (and
// other host objects: sockets, streams) cannot be passed through the structured
// clone algorithm used by `MessagePort.postMessage`. `serializeError` must
// therefore project error payloads into a clone-safe shape, otherwise a single
// transient upstream error (e.g. a 429) thrown out of a worker-thread stream
// crashes the stream with an opaque "unserializable error" instead of being
// delivered to the host as a proper, classifiable error.
class HttpResponse {
    constructor(
        public readonly status: number,
        public readonly url: string,
        public readonly headers: Headers,
        public readonly body: unknown
    ) {}

    toJSON() {
        return {
            status: this.status,
            url: this.url,
            headers: Array.from(this.headers),
            body: this.body,
        }
    }
}

class HttpError extends Error {
    constructor(public readonly response: HttpResponse) {
        super(`Got ${response.status} from ${response.url}`)
    }

    get name(): string {
        return 'HttpError'
    }
}

function makeHttpError(): HttpError {
    let headers = new Headers({'content-type': 'text/plain', 'cf-ray': 'deadbeef'})
    let response = new HttpResponse(429, 'https://rpc.example/vip/key', headers, '{"error":429}')
    return new HttpError(response)
}


it('serializes an error carrying non-cloneable host objects (Headers) into a structured-clone-safe payload', () => {
    let ser = serializeError(makeHttpError())

    // `MessagePort.postMessage` uses the structured clone algorithm; this must
    // not throw a DataCloneError.
    let cloned = structuredClone(ser)

    assert.strictEqual(cloned.name, 'HttpError')
    assert.strictEqual(cloned.message, 'Got 429 from https://rpc.example/vip/key')
    // diagnostic context survives the round-trip
    assert.strictEqual((cloned as any).response.status, 429)
    assert.strictEqual((cloned as any).response.url, 'https://rpc.example/vip/key')
})


it('round-trips through RemoteError preserving the response payload', () => {
    let ser = structuredClone(serializeError(makeHttpError()))
    let remote = new RemoteError(ser)

    assert.strictEqual(remote.name, 'HttpError')
    assert.strictEqual(remote.message, 'Got 429 from https://rpc.example/vip/key')
    assert.strictEqual((remote as any).response.status, 429)
})
