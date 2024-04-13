import {runProgram} from '@subsquid/util-internal'
import {ArchiveLayout, getChunkPath, getShortHash, RawBlock} from '@subsquid/util-internal-archive-layout'
import {FileOrUrl, nat} from '@subsquid/util-internal-commander'
import {createFs} from '@subsquid/util-internal-fs'
import {Range} from '@subsquid/util-internal-range'
import {Command} from 'commander'
import assert from 'node:assert'


runProgram(async () => {
    let program = new Command()
    program.description('Validates chain continuity of a raw archive')
    program.argument('<archive-url>', 'Either local dir or s3:// url', FileOrUrl(['s3:']))
    program.option('--first-block <number>', 'Defines the first chunk to check', nat)
    program.option('--last-block <number>', 'Defines the last chunk to check', nat)
    program.option('--parent-hash <prop>', 'Parent hash property, e.g. block.parentHash')
    program.parse()

    let archiveUrl = program.args[0]

    let options: {
        firstBlock?: number
        lastBlock?: number
        parentHash?: string
    } = program.opts()

    let range: Range = {
        from: options.firstBlock ?? 0
    }

    if (options.lastBlock != null) {
        range.to = options.lastBlock
        if (range.to < range.from) {
            console.error(`invalid block range: --last-block=${range.to} is less than --first-block=${range.from}`)
            process.exit(1)
        }
    }

    let getParentHash = options.parentHash == null ? undefined : createParentHashGetter(options.parentHash)

    let archive = new ArchiveLayout(createFs(archiveUrl))

    let prev: RawBlock | undefined

    for await (let chunk of archive.getDataChunks(range)) {
        let errors: string[] = []
        let firstBlock: RawBlock | undefined
        let lastBlock: RawBlock | undefined
        for await (let batch of archive.readRawChunk<RawBlock>(chunk)) {
            for (let block of batch) {
                if (prev) {
                    if (prev.height !== block.height - 1) {
                        errors.push(`${block.height} follows ${prev.height}`)
                    }
                    if (getParentHash && getParentHash(block) !== prev.hash) {
                        console.log(getParentHash(block))
                        errors.push(`parent hash of block ${block.height} does not match the hash of block ${prev.height}`)
                    }
                }
                prev = block
                firstBlock = firstBlock || block
                lastBlock = block
            }
        }
        if (firstBlock == null) {
            errors.push('empty chunk')
        } else {
            assert(lastBlock)
            if (firstBlock.height !== chunk.from) {
                errors.push(`first block is ${firstBlock.height}`)
            }
            if (lastBlock.height !== chunk.to) {
                errors.push(`last block is ${lastBlock.height}`)
            }
            if (getShortHash(lastBlock.hash) !== chunk.hash) {
                errors.push(`last block has short hash ${lastBlock.hash}`)
            }
        }
        if (errors.length == 0) {
            console.log(`chunk ${getChunkPath(chunk)}: ok`)
        } else {
            for (let err of errors) {
                console.log(`chunk ${getChunkPath(chunk)}: error: ${err}`)
            }
        }
    }
})


interface HashAndHeight {
    hash: string
    height: number
}


function createParentHashGetter(prop: string): (block: RawBlock) => string {
    let path = prop.split('.')
    return function getParentHash(block: any) {
        let val: any = block
        for (let i = 0; i < path.length; i++) {
            val = val[path[i]]
        }
        return val
    }
}
