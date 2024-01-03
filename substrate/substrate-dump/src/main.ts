import {
    BlockData,
    DataRequest,
    RpcDataSource,
    runtimeVersionEquals,
    RuntimeVersionId
} from '@subsquid/substrate-data-raw'
import {assertNotNull, def} from '@subsquid/util-internal'
import {Command, Dumper, DumperOptions, getShortHash} from '@subsquid/util-internal-dump-cli'
import assert from 'assert'
import {MetadataWriter} from './metadata'


interface Options extends DumperOptions {
    withTrace?: boolean | string
}


class SubstrateDumper extends Dumper<BlockData, DataRequest, Options> {
    setUpProgram(program: Command) {
        program.description('RPC data archiving tool for substrate based chains')
        program.option('--with-trace [targets]', 'Fetch block trace')
    }

    @def
    getDataRequest(): DataRequest {
        let options = this.options()
        return {
            runtimeVersion: true,
            extrinsics: true,
            events: true,
            trace: typeof options.withTrace == 'string'
                ? options.withTrace
                : options.withTrace ? '' : undefined
        }
    }

    @def
    getDataSource(): RpcDataSource {
        return new RpcDataSource({
            rpc: this.rpc(),
            headPollInterval: 10_000
        })
    }

    getPrevBlockHash(block: BlockData): string {
        return block.block.block.header.parentHash
    }

    process(batches: AsyncIterable<BlockData[]>): AsyncIterable<BlockData[]> {
        if (this.options().dest == null) {
            return this.addMetadata(batches)
        } else {
            return this.saveMetadata(batches)
        }
    }

    private async *addMetadata(batches: AsyncIterable<BlockData[]>): AsyncIterable<BlockData[]> {
        let prevRuntimeVersion: RuntimeVersionId | undefined
        for await (let batch of batches) {
            for (let block of batch) {
                if (prevRuntimeVersion && runtimeVersionEquals(prevRuntimeVersion, assertNotNull(block.runtimeVersion))) {

                } else {
                    block.metadata = await this.getDataSource().rpc.getMetadata(block.hash)
                    prevRuntimeVersion = block.runtimeVersion
                }
            }
            yield batch
        }
    }


    private async *saveMetadata(batches: AsyncIterable<BlockData[]>): AsyncIterable<BlockData[]> {
        let writer = new MetadataWriter(this.destination().cd('metadata'))
        let prevRuntimeVersion: RuntimeVersionId | undefined
        for await (let batch of batches) {
            for (let block of batch) {
                let v = assertNotNull(block.runtimeVersion)
                if (prevRuntimeVersion && runtimeVersionEquals(prevRuntimeVersion, v)) {

                } else {
                    await writer.save({
                        specName: v.specName,
                        specVersion: v.specVersion,
                        implName: v.implName,
                        implVersion: v.implVersion,
                        blockHeight: block.height,
                        blockHash: getShortHash(block.hash)
                    }, async () => {
                        let metadata = await this.getDataSource().rpc.getMetadata(block.hash)
                        assert(metadata, 'finalized blocks are supposed to be always available')
                        return metadata
                    })
                    prevRuntimeVersion = v
                }
            }
            yield batch
        }
    }
}


new SubstrateDumper().run()
