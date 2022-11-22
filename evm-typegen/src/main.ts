import {Interface} from '@ethersproject/abi'
import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {OutDir} from '@subsquid/util-internal-code-printer'
import {program} from 'commander'
import fs from 'fs'
import path from 'path'
import {Typegen} from './typegen'


const LOG = createLogger('sqd:evm-typegen')


runProgram(async function() {
    program
        .description(`
Generates TypeScript facades for EVM transactions, logs and issuing eth_call queries.

Designed to be used withing squid mapping projects.
    `.trim())
        .name('squid-evm-typegen')
        .argument('<output-dir>', 'output directory for generated definitions')
        .argument('[abi...]', 'list of ABI files')
        .option('--multicall', 'generate facade for MakerDAO multicall contract')
        .option('--clean', 'delete output directory before run')

    program.parse()

    let {clean, multicall} = program.opts<{clean?: boolean, multicall?: boolean}>()
    let dest = new OutDir(program.args[0])
    let abiFiles = program.args.slice(1)

    if (clean && dest.exists()) {
        LOG.info(`deleting ${dest.path()}`)
        dest.del()
    }

    if (abiFiles.length == 0 && !multicall) {
        LOG.warn('no ABI files given, nothing to generate')
        return
    }

    dest.add('abi.support.ts', [__dirname, '../src/abi.support.ts'])
    LOG.info(`saved ${dest.path('abi.support.ts')}`)

    if (multicall) {
        dest.add('multicall.ts', [__dirname, '../src/multicall.ts'])
        LOG.info(`saved ${dest.path('multicall.ts')}`)
    }

    for (let abiFile of abiFiles) {
        let abi = new Interface(await read(abiFile))
        new Typegen(dest, abi, basename(abiFile), LOG).generate()
    }
}, err => LOG.fatal(err))


async function read(file: string): Promise<any> {
    LOG.info(`reading ${file}`)
    let content = fs.readFileSync(file, 'utf-8')
    return JSON.parse(content)
}


function basename(file: string): string {
    let p = path.parse(file)
    return p.name
}
