import {createNodeHttpServer, ListeningServer} from '@subsquid/util-internal-http-server'
import express from 'express'
import {IPFS} from 'ipfs-core'
import {CID} from 'multiformats'
import {getCidPath, IpfsCache} from './cache.js'


export interface IpfsServiceOptions {
    ipfs: IPFS
    cache: IpfsCache
}


export function createIpfsService({ipfs, cache}: IpfsServiceOptions): Promise<ListeningServer> {
    let app = express()

    app.get('/cache/:cid', async (req, res) => {
        let cid: CID
        try {
            cid = CID.parse(req.params.cid)
        } catch(e: any) {
            res.status(404).send(`invalid CID path: ${req.params.cid}`)
            return
        }
        await cache.put(cid)
        res.type('text/plain').send(getCidPath(cid))
    })

    app.post('/publish', async (req, res) => {
        let {cid} = await ipfs.add(req)
        res.type('text/plain').send(cid.toString())
    })

    return createNodeHttpServer(app, 27654)
}
