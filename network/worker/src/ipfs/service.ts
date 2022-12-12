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

    app.set('etag', false)

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

    app.post('/fs/*', async (req, res) => {
        let path = req.path.slice(3)
        await ipfs.files.write(path, req, {
            create: true,
            parents: true
        })
        res.status(204).send()
    })

    app.get('/fs/*', async (req, res) => {
        let path = req.path.slice(3)
        let stat
        try {
            stat = await ipfs.files.stat(path)
        } catch(err: any) {
            if (err.code == 'ERR_NOT_FOUND') {
                res.status(404).type('text/plain').send(`${path} not found`)
                return
            } else {
                throw err
            }
        }
        res.type('text/plain').send(stat.cid.toString())
    })

    return createNodeHttpServer(app, 27654)
}
