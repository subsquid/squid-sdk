import {
    BlockData,
    DataRequest,
    RpcDataSource,
    runtimeVersionEquals,
    RuntimeVersionId
} from '@subsquid/substrate-data-raw'
import {assertNotNull, def} from '@subsquid/util-internal'
import {Command, Dumper, DumperOptions, getShortHash, Range} from '@subsquid/util-internal-dump-cli'
import assert from 'assert'
import {MetadataWriter} from './metadata'


interface Options extends DumperOptions {
    withTrace?: boolean | string
    finalityConfirmation?: number
}


export class SubstrateDumper extends Dumper<BlockData, Options> {
    protected setUpProgram(program: Command) {
        program.description('RPC data archiving tool for substrate based chains')
        program.option('--with-trace [targets]', 'Fetch block trace')
        program.option('--finality-confirmation', 'Finality offset from the head of the chain')
    }

    @def
    private getDataSource(): RpcDataSource {
        return new RpcDataSource({
            rpc: this.rpc(),
            headPollInterval: 10_000,
            finalityConfirmation: this.options().finalityConfirmation
        })
    }

    protected getLastFinalizedBlockNumber(): Promise<number> {
        return this.getDataSource().getFinalizedHeight()
    }

    protected getBlocks(range: Range): AsyncIterable<BlockData[]> {
        let batches = this.getBlockBatches(range)
        if (this.options().dest == null) {
            batches = this.addMetadata(batches)
        } else {
            batches = this.saveMetadata(batches)
        }
        return batches
    }

    private async *getBlockBatches(range: Range): AsyncIterable<BlockData[]> {
        let {withTrace} = this.options()

        let request: DataRequest = {
            runtimeVersion: true,
            extrinsics: true,
            events: true,
            trace: typeof withTrace == 'string'
                ? withTrace
                : withTrace ? '' : undefined
        }

        for await (let batch of this.getDataSource().getFinalizedBlocks([{
            range,
            request
        }])) {
            yield batch.blocks
        }
    }

    private async* addMetadata(batches: AsyncIterable<BlockData[]>): AsyncIterable<BlockData[]> {
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

    private async* saveMetadata(batches: AsyncIterable<BlockData[]>): AsyncIterable<BlockData[]> {
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

    protected getParentBlockHash(block: BlockData): string {
        return block.block.block.header.parentHash
    }

    protected getBlockTimestamp(block: BlockData): number {
        return Math.floor(Date.now() / 1000); //mocked timestamp for now
    }
}
