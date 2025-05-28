import {GraphqlMessage, HttpClient, HttpError} from '@subsquid/http-client'
import expect from 'expect'
import {createClient, ExecutionResult} from 'graphql-ws'
import WebSocket from 'ws'


export class Client {
    private client: HttpClient

    constructor(public endpoint: string) {
        this.client = new HttpClient()
    }

    query(query: string): Promise<{data?: any, errors?: GraphqlMessage[]}> {
        return this.client.post(this.endpoint, {
            json: {query}
        })
    }

    async test(query: string, expectedData: any): Promise<void> {
        let response = await this.query(query)
        expect(response).toEqual({data: expectedData})
    }

    async httpErrorTest(query: string, errorData: any): Promise<void> {
        let response: any = await this.query(query).catch(err => err)
        expect(response).toBeInstanceOf(HttpError)
        expect(response.response.body).toEqual(errorData)
    }

    async httpErrorMatch(query: string, errorData: any): Promise<void> {
        let response: any = await this.query(query).catch(err => err)
        expect(response).toBeInstanceOf(HttpError)
        expect(response.response.body).toMatchObject(errorData)
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
