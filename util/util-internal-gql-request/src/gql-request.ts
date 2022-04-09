import assert from "assert"
import fetch from "node-fetch"


export interface GraphqlRequest {
    url: string
    query: string
    method?: 'GET' | 'POST'
}


export async function graphqlRequest<T>(req: GraphqlRequest): Promise<T> {
    let url = req.url
    let method = req.method || 'POST'
    let headers: Record<string, string> = {
        'accept': 'application/json',
        'accept-encoding': 'gzip, br'
    }
    let body: string | undefined

    if (method == 'GET') {
        url = addUrlParameter(url, 'query', req.query)
    } else {
        headers['content-type'] = 'application/json; charset=UTF-8'
        body = JSON.stringify({query: req.query})
    }

    let response = await fetch(url, {
        method,
        body,
        headers
    })

    if (!response.ok) {
        let body = await response.text()
        throw new Error(`Got http ${response.status}${body ? `, body: ${body}` : ''}`)
    }

    let result = await response.json()
    if (result.errors?.length) {
        throw new Error(`GraphQL error: ${result.errors[0].message}`)
    }

    assert(result.data != null)

    return result.data as T
}


function addUrlParameter(url: string, name: string, val: string): string {
    if (url.includes('?')) {
        url += '&'
    } else {
        url += '?'
    }
    return url + name + '=' +encodeURIComponent(val)
}
