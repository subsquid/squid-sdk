import express from 'express'
import Redis from 'ioredis'


const PORT = process.env.PORT || 3000
const HYDRA_VERSION = process.env.HYDRA_VERSION || require('../package.json').version
const redis = new Redis(process.env.REDIS_URI)
const app = express()


app.all('/status', async function (req, res) {
    const status = await redis.hgetall('hydra:indexer:status')

    function integer(prop: string): number {
        if (status?.[prop] == null || status[prop].length === 0) return -1
        const value = Number.parseInt(status[prop])
        return Number.isFinite(value) ? value : -1
    }

    const head = integer('HEAD')
    const chainHeight = integer('CHAIN_HEIGHT')
    const lastComplete = integer('LAST_COMPLETE')
    const maxComplete = integer('MAX_COMPLETE')
    const inSync = chainHeight === head && head > 0

    res.json({
        hydraVersion: HYDRA_VERSION,
        head,
        chainHeight,
        lastComplete,
        maxComplete,
        inSync,
    })
})


app.set('etag', false)


app.listen(PORT, () => {
    console.error(`archive status service is listening on port ${PORT}`)
})
