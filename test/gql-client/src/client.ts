import fetch from "node-fetch"
import expect from "expect"


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
}


export class HttpError extends Error {
    constructor(public readonly status: number, public readonly body: string) {
        super(`Got http ${status}, body: ${body} `)
    }
}
