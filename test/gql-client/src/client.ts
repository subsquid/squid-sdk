import expect from "expect"
import {createClient, ExecutionResult} from "graphql-ws"
import fetch from "node-fetch"
import WebSocket from "ws"

export class Client {
    constructor(public endpoint: string) {}

    async query<R=any>(q: string): Promise<R> {
        let response = await fetch(this.endpoint, {
            method: 'POST',
            body: JSON.stringify({query: q}),
            headers: {
                'content-type': 'application/json',
                'accept': 'application/json'
            }
        })
        if (!response.ok) {
            throw new HttpError(response.status, await response.text())
        }
        expect(response.headers.get('content-type')).toMatch('application/json')
        let result = await response.json()
        return result as R
    }

    async test(query: string, expectedData: any): Promise<void> {
        let response = await this.query(query)
        expect(response).toEqual({data: expectedData})
    }

    async errorTest(query: string, errorData: any): Promise<void> {
        let response = await this.query(query).catch(err => err)
        expect(response).toBeInstanceOf(HttpError)
        expect(JSON.parse(response.body)).toEqual(errorData)
    }

    subscriptionTest<R>(
        q: string,
        test: (take: () => Promise<ExecutionResult<R>>) => Promise<void>
    ): Promise<void> {
        let url = new URL(this.endpoint)
        url.protocol = 'ws'
        let client = createClient({
            url: url.toString(),
            webSocketImpl: WebSocket
        })

        return new Promise<void>((resolve, reject) => {
            let results: ExecutionResult<R>[] = []
            let completed = false

            let future: {
                resolve: (res: ExecutionResult<R>) => void,
                reject: (err: Error) => void
            } | undefined

            function take(): Promise<ExecutionResult<R>> {
                if (completed) {
                    throw new Error('Unexpected EOS')
                }
                let res = results.pop()
                if (res) {
                    return Promise.resolve(res)
                } else {
                    return new Promise((resolve, reject) => {
                        future = {resolve, reject}
                    })
                }
            }

            client.subscribe({query: q}, {
                next(res: any) {
                    if (future) {
                        let f = future
                        future = undefined
                        f.resolve(res)
                    } else {
                        results.push(res)
                    }
                },
                error: reject,
                complete() {
                    completed = true
                    if (future) {
                        future.reject(new Error('Unexpected EOS'))
                    }
                }
            })

            test(take).then(resolve, reject)

        }).finally(() => client.terminate())
    }
}


export class HttpError extends Error {
    constructor(public readonly status: number, public readonly body: string) {
        super(`Got http ${status}, body: ${body} `)
    }
}
