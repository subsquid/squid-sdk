import {createHttpServer, ListeningServer} from '@subsquid/util-internal-http-server'
import {CID} from 'multiformats'
import {IpfsCache} from './cache'


export function createIpfsCacheService(cache: IpfsCache): Promise<ListeningServer> {
    return createHttpServer(async ctx => {
        let cidString = ctx.url.pathname.slice(1)
        let cid: CID
        try {
            cid = CID.parse(cidString)
        } catch(e: any) {
            return ctx.send(404, `invalid CID path: ${cidString}`)
        }
        await cache.put(cid)
        ctx.send(200)
    })
}
