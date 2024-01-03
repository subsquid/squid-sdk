import {Block, DataRequest, RpcDataSource} from '@subsquid/solana-data/lib/rpc'
import {def} from '@subsquid/util-internal'
import {Command, DataSource, Dumper, DumperOptions, positiveInt} from '@subsquid/util-internal-dump-cli'


interface Options extends DumperOptions {
    strideSize: number
}


class SolanaDumper extends Dumper<Block, DataRequest, Options> {
    setUpProgram(program: Command): void {
        program.description('RPC data archiving tool for Solana')
        program.option('--stride-size <N>', 'Maximum size of getBlock batch call', positiveInt, 10)
    }

    getDefaultChunkSize(): number {
        return 128
    }

    getDefaultTopDirSize(): number {
        return 8192
    }

    getDataRequest(): DataRequest {
        return {
            rewards: true,
            transactions: true
        }
    }

    @def
    getDataSource(): DataSource<Block, DataRequest> {
        return new RpcDataSource({
            rpc: this.rpc(),
            headPollInterval: 10_000,
            strideSize: this.options().strideSize
        })
    }

    getPrevBlockHash(block: Block): string {
        return block.block.previousBlockhash
    }
}


new SolanaDumper().run()
