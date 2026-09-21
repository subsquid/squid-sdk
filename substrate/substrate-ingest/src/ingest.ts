import {Parser} from '@subsquid/substrate-data'
import * as raw from '@subsquid/substrate-data-raw'
import {
    getOldTypesBundle,
    OldSpecsBundle,
    OldTypesBundle,
    readOldTypesBundle
} from '@subsquid/substrate-runtime/lib/metadata'
import {def} from '@subsquid/util-internal'
import {Command, Ingest, IngestOptions, nat, Range} from '@subsquid/util-internal-ingest-cli'
import {toJSON} from '@subsquid/util-internal-json'


interface Options extends IngestOptions {
    skipBlocks?: number[]
    typesBundle?: string
}


function collectBlocks(val: string, prev: number[]) {
    return prev.concat([nat(val)])
}


export class SubstrateIngest extends Ingest<Options> {
    protected getLoggingNamespace(): string {
        return 'sqd:substrate-ingest'
    }

    protected hasRpc(): 'required' | boolean {
        return 'required'
    }

    protected setUpProgram(program: Command) {
        program.description('Data decoder and fetcher for substrate based chains')
        program.option('--skip-blocks <blocks...>', 'A list of (errorneous?) blocks to skip', collectBlocks, [])
        program.option('--types-bundle <file>', 'JSON file with custom type definitions')
    }

    @def
    private typesBundle(): OldTypesBundle | OldSpecsBundle | undefined {
        let {typesBundle} = this.options()
        if (typesBundle == null) return
        return getOldTypesBundle(typesBundle) || readOldTypesBundle(typesBundle)
    }

    private async *getRawBlocksFromRpc(range: Range): AsyncIterable<raw.BlockData[]> {
        let src = new raw.RpcDataSource({
            rpc: this.rpc()
        })
        for await (let batch of src.getFinalizedBlocks([{
            range,
            request: {
                runtimeVersion: true,
                extrinsics: true,
                events: true
            }
        }])) {
            yield batch.blocks
        }
    }

    protected async *getBlocks(range: Range): AsyncIterable<object[]> {
        let parser = new Parser(
            new raw.Rpc(this.rpc()),
            [{
                range,
                request: {
                    blockValidator: true,
                    blockTimestamp: true,
                    events: true,
                    extrinsics: {
                        fee: true,
                        hash: true
                    }
                }
            }],
            this.typesBundle(),
            this.options().skipBlocks
        )

        let blockStream = this.hasArchive()
            ? this.archive().getRawBlocks<raw.BlockData>(range)
            : this.getRawBlocksFromRpc(range)

        for await (let batch of blockStream) {
            let blocks = await parser.parseCold(batch)
            yield toJSON(blocks)
        }
    }

    protected getBlockHeight(block: any): number {
        return block.header.height || 0
    }

    protected getBlockTimestamp(block: any): number {
        return Math.floor(block.header.timestamp / 1000) || 0
    }
}
