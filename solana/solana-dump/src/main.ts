import {Block, DataRequest, RpcDataSource} from '@subsquid/solana-data/lib/rpc'
import {def} from '@subsquid/util-internal'
import {Command, DataSource, Dumper} from '@subsquid/util-internal-rpc-dump'


class SolanaDumper extends Dumper<Block, DataRequest> {
    setUpProgram(program: Command): void {
        program.description('RPC data archiving tool for Solana')
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
            headPollInterval: 10_000
        })
    }

    getPrevBlockHash(block: Block): string {
        return block.block.previousBlockhash
    }
}


new SolanaDumper().run()
