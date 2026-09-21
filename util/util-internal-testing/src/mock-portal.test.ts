import {describe, expect, it} from 'vitest'
import {createFinalizedMockPortal, createMockPortal} from './mock-portal'

async function fetchText(
    url: string,
    init?: {method?: string; body?: string},
): Promise<{status: number; headers: Record<string, string>; body: string}> {
    const res = await fetch(url, {
        method: init?.method ?? 'GET',
        body: init?.body,
        headers: init?.body ? {'Content-Type': 'application/json'} : undefined,
    })
    const headers: Record<string, string> = {}
    res.headers.forEach((v, k) => {
        headers[k] = v
    })
    return {status: res.status, headers, body: await res.text()}
}

describe('MockPortal', () => {
    it('serves /metadata regardless of queued responses', async () => {
        const portal = await createMockPortal([])
        try {
            const {status, body} = await fetchText(`${portal.url}/metadata`)
            expect(status).toBe(200)
            const json = JSON.parse(body)
            expect(json.dataset).toBe('mock-dataset')
            expect(json.metadata.kind).toBe('evm')
        } finally {
            await portal.close()
        }
    })

    it('returns 404 for unknown paths', async () => {
        const portal = await createMockPortal([])
        try {
            const {status} = await fetchText(`${portal.url}/nope`)
            expect(status).toBe(404)
        } finally {
            await portal.close()
        }
    })

    it('serves a queued 200 response as JSONL with finalized/latest head headers', async () => {
        let observedRequestBody: any
        const portal = await createMockPortal([
            {
                statusCode: 200,
                data: [
                    {header: {number: 1, hash: '0x1', timestamp: 1000}},
                    {header: {number: 2, hash: '0x2', timestamp: 2000}},
                ],
                head: {
                    finalized: {number: 1, hash: '0x1'},
                    latest: {number: 2},
                },
                validateRequest: (body) => {
                    observedRequestBody = body
                },
            },
        ])
        try {
            const {status, headers, body} = await fetchText(`${portal.url}/stream`, {
                method: 'POST',
                body: JSON.stringify({fromBlock: 1}),
            })

            expect(status).toBe(200)
            expect(headers['content-type']).toBe('application/jsonl')
            expect(headers['x-sqd-finalized-head-number']).toBe('1')
            expect(headers['x-sqd-finalized-head-hash']).toBe('0x1')
            expect(headers['x-sqd-head-number']).toBe('2')

            const lines = body.split('\n').filter((l) => l.length > 0)
            expect(lines.length).toBe(2)
            expect(JSON.parse(lines[0])).toEqual({header: {number: 1, hash: '0x1', timestamp: 1000}})
            expect(JSON.parse(lines[1])).toEqual({header: {number: 2, hash: '0x2', timestamp: 2000}})

            expect(observedRequestBody).toEqual({fromBlock: 1})
        } finally {
            await portal.close()
        }
    })

    it('serves a queued 409 conflict with previousBlocks body', async () => {
        const portal = await createMockPortal([
            {
                statusCode: 409,
                data: {previousBlocks: [{number: 5, hash: '0x5'}]},
            },
        ])
        try {
            const {status, headers, body} = await fetchText(`${portal.url}/stream`, {
                method: 'POST',
                body: JSON.stringify({}),
            })
            expect(status).toBe(409)
            expect(headers['content-type']).toBe('application/json')
            expect(JSON.parse(body)).toEqual({previousBlocks: [{number: 5, hash: '0x5'}]})
        } finally {
            await portal.close()
        }
    })

    it('falls through to 500 when the mock queue is exhausted', async () => {
        const portal = await createMockPortal([{statusCode: 204}])
        try {
            const first = await fetchText(`${portal.url}/stream`, {method: 'POST'})
            expect(first.status).toBe(204)

            const second = await fetchText(`${portal.url}/stream`, {method: 'POST'})
            expect(second.status).toBe(500)
        } finally {
            await portal.close()
        }
    })

    it('routes to /finalized-stream when finalized=true', async () => {
        const portal = await createFinalizedMockPortal([{statusCode: 204}])
        try {
            const wrongPath = await fetchText(`${portal.url}/stream`, {method: 'POST'})
            expect(wrongPath.status).toBe(404)

            const correctPath = await fetchText(`${portal.url}/finalized-stream`, {method: 'POST'})
            expect(correctPath.status).toBe(204)
        } finally {
            await portal.close()
        }
    })
})
