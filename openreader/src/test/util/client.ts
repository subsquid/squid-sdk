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
            throw new Error(`Got http ${response.status}, body: ${await response.text()}`)
        }
        expect(response.headers.get('content-type')).toMatch('application/json')
        let result = await response.json()
        return result as R
    }

    async test(query: string, expectedData: any): Promise<void> {
        let response = await this.query(query)
        expect(response).toEqual({data: expectedData})
    }
}
