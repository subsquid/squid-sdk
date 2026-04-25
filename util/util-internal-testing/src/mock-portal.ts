import {type IncomingMessage, type Server, type ServerResponse, createServer} from 'node:http'

type ValidateRequest = (body: any) => unknown

export type MockResponse =
    | {
          statusCode: 204
          validateRequest?: ValidateRequest
      }
    | {
          statusCode: 200
          data: {
              header: {
                  number: number
                  hash: string
                  timestamp?: number
              }
              logs?: any[]
              instructions?: any[]
          }[]
          head?: {
              finalized?: {number: number; hash: string}
              latest?: {number: number}
          }
          validateRequest?: ValidateRequest
      }
    | {
          statusCode: 409
          data: {
              previousBlocks: {
                  number: number
                  hash: string
              }[]
          }
          validateRequest?: ValidateRequest
      }
    | {
          statusCode: 500 | 503
          validateRequest?: ValidateRequest
      }

export interface MockPortal {
    server: Server
    url: string
    close(): Promise<void>
}

export async function createFinalizedMockPortal(mockResponses: MockResponse[]): Promise<MockPortal> {
    return createMockPortal(mockResponses, {finalized: true})
}

export async function createMockPortal(
    mockResponses: MockResponse[],
    {finalized = false}: {finalized?: boolean} = {},
): Promise<MockPortal> {
    const streamUrl = finalized ? '/finalized-stream' : '/stream'
    let requestCount = 0

    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
        if (req.url?.startsWith('/metadata')) {
            res.writeHead(200, {'Content-Type': 'application/json'})
            res.write(
                JSON.stringify({
                    dataset: 'mock-dataset',
                    aliases: [],
                    real_time: true,
                    start_block: 0,
                    metadata: {kind: 'evm'},
                }),
            )
            res.end()
            return
        }

        if (req.url !== streamUrl) {
            res.statusCode = 404
            res.end()
            return
        }

        const mockResp = mockResponses[requestCount] as MockResponse | undefined

        let body = ''
        req.on('data', (chunk) => {
            body += chunk
        })
        req.on('end', () => {
            if (!mockResp) {
                res.statusCode = 500
                res.end()
                return
            }

            mockResp.validateRequest?.(body ? JSON.parse(body) : undefined)

            switch (mockResp.statusCode) {
                case 200: {
                    const headers: Record<string, string | number> = {
                        'Content-Type': 'application/jsonl',
                    }
                    if (mockResp.head?.finalized?.number != null) {
                        headers['X-Sqd-Finalized-Head-Number'] = mockResp.head.finalized.number
                    }
                    if (mockResp.head?.finalized?.hash) {
                        headers['X-Sqd-Finalized-Head-Hash'] = mockResp.head.finalized.hash
                    }
                    if (mockResp.head?.latest?.number != null) {
                        headers['X-Sqd-Head-Number'] = mockResp.head.latest.number
                    }
                    res.writeHead(mockResp.statusCode, headers)
                    for (const item of mockResp.data) {
                        res.write(`${JSON.stringify(item)}\n`)
                    }
                    break
                }
                case 409:
                    res.writeHead(mockResp.statusCode, {'Content-Type': 'application/json'})
                    res.write(JSON.stringify(mockResp.data))
                    break
                default:
                    res.writeHead(mockResp.statusCode)
                    break
            }

            requestCount++
            res.end()
        })
    })

    await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(0, '127.0.0.1', () => {
            server.off('error', reject)
            resolve()
        })
    })

    return {
        server,
        url: getServerAddress(server),
        close: () =>
            new Promise<void>((resolve, reject) => {
                server.close((err) => (err ? reject(err) : resolve()))
            }),
    }
}

function getServerAddress(server: Server): string {
    const address = server.address()
    if (!address || typeof address === 'string') {
        throw new Error('Invalid server address')
    }
    return `http://127.0.0.1:${address.port}`
}

export async function readAll<T>(stream: AsyncIterable<{data: T[]}>): Promise<T[]> {
    const res: T[] = []
    for await (const chunk of stream) {
        res.push(...chunk.data)
    }
    return res
}
