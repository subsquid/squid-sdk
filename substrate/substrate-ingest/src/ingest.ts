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
import {BlockTracker, PrismaClient} from "../prisma";

interface Options extends IngestOptions {
    skipBlocks?: number[]
    typesBundle?: string
}

const prisma = new PrismaClient();

function collectBlocks(val: string, prev: number[]) {
    return prev.concat([nat(val)])
}


async function addToDB(blockDetails: any) {
   // console.log('blockDetails:::', JSON.stringify(blockDetails));
    const callData: any[] = [];
    const eventData: any[] = [];
    const extrinsicData: any[] = [];
    const blockData =
        blockDetails.map((blockDetail: any) => {
            let {
                height,
                hash,
                parentHash,
                extrinsicsRoot,
                stateRoot,
                specName,
                specVersion,
                validator,
                timestamp
            } = blockDetail.header;
            const { calls, events, extrinsics } = blockDetail;
            const heightStr = height.toString().padStart(10, "0");
            const hashStr = hash.slice(2, 7);
            const blockId = `${heightStr}-${hashStr}`;
            const specId = `${specName}@${specVersion}`;
            timestamp = new Date(timestamp);
            // console.log("Calls::", calls);
            calls.map((callDetail: any) => {
                console.log('callDetail::',JSON.stringify(callDetail));
                const { extrinsicIndex, name, args, success, address } = callDetail;
                const index = extrinsicIndex.toString().padStart(6, "0");
                const batchIndex = address[0] ? `-${address[0]}` : '';
                const extrinsicId = `${heightStr}-${index}-${hashStr}${batchIndex}`;
                callData.push({
                    callId: extrinsicId,
                    blockId: blockId,
                    args: args,
                    name: name,
                    success: success,
                    extrinsicId: extrinsicId
                });
            });
            events.map((eventDetail: any) => {
                const { index, extrinsicIndex, name, args, phase } = eventDetail;
                const extIndex = extrinsicIndex?.toString().padStart(6, "0");
                const extrinsicId = extIndex ? `${heightStr}-${extIndex}-${hashStr}` : null;
                const evntId = index.toString().padStart(6, "0");
                const eventId = `${heightStr}-${evntId}-${hashStr}`;
                eventData.push({
                    eventId: eventId,
                    extrinsicId: extrinsicId,
                    name: name,
                    args: args,
                    blockId: blockId,
                    phase: phase
                })
            });

            extrinsics.map((extrinsicDetail: any) => {
                console.log('extrinsicDetail:',JSON.stringify(extrinsicDetail));
                const { index, version, hash, success, signature, error, tip, fee } = extrinsicDetail;

                const extIndex = index.toString().padStart(6, "0");
                const extrinsicId = `${heightStr}-${extIndex}-${hashStr}`;
                extrinsicData.push({
                    callId: extrinsicId,
                    extrinsicId: extrinsicId,
                    version: version,
                    hash: hash,
                    blockId: blockId,
                    success: success,
                    signature: signature || null,
                    error: error || null,
                    tip: tip || null,
                    fee: fee || null
                })
            });

            return { blockId, height, hash, parentHash, extrinsicsRoot, stateRoot, specId, validator, timestamp };
        });

    await Promise.all(
        blockData.map(async (blockInfo: any) => {
            await prisma.block.upsert({
                where: {
                    height: blockInfo.height
                },
                update: blockInfo,
                create: blockInfo
            });
        })
    );

    await Promise.all(
        callData.map(async (callInfo: any) => {
            console.log('callInfo:::', JSON.stringify(callInfo));
            await prisma.call.upsert({
                where: {
                    callId: callInfo.callId
                },
                update: callInfo,
                create: callInfo
            });
        })
    );

    await Promise.all(
        eventData.map(async (eventInfo: any) => {
            await prisma.event.upsert({
                where: {
                    eventId: eventInfo.eventId
                },
                update: eventInfo,
                create: eventInfo
            });
        })
    );

    await Promise.all(
        extrinsicData.map(async (extrinsicInfo: any) => {
            await prisma.extrinsic.upsert({
                where: {
                    extrinsicId: extrinsicInfo.extrinsicId
                },
                update: extrinsicInfo,
                create: extrinsicInfo
            });
        })
    );

    const lastBlockAdded = blockData[blockData.length - 1].height;
    const blkTrckrData = { blockScanned: lastBlockAdded }
    const blockTracker: BlockTracker = await prisma.blockTracker.findFirst() as unknown as BlockTracker;
    await prisma.blockTracker.upsert({
        where: {
            id: blockTracker.id
        },
        update: blkTrckrData,
        create: blkTrckrData
    });
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
        return {
            types: {
                EthWalletCall: {
                    nonce: "u32",
                },VersionedEventProof: {
                    _enum: {
                        sentinel: null,
                        EventProof: "EventProof",
                    },
                },
                ExtrinsicSignature: "EthereumSignature",
                EthyId: "[u8; 32]",
                EthyEventId: "u64",
                EthEventProofResponse: {
                    event_id: "EventProofId",
                    signatures: "Vec<Bytes>",
                    validators: "Vec<AccountId20>",
                    validator_set_id: "ValidatorSetId",
                    block: "H256",
                    tag: "Option<Bytes>",
                },
                EventProofId: "u64",
                EthereumSignature: {
                    r: "H256",
                    s: "H256",
                    v: "U8",
                },
                EventProof: {
                    digest: "EthyId",
                    eventId: "EventProofId",
                    validatorSetId: "ValidatorSetId",
                    signatures: "Vec<Bytes>",
                    block: "[u8; 32]",
                },
                CollectionUuid: "u32",
                SerialNumber: "u32",
                TokenId: "(CollectionUuid, SerialNumber)",
                CollectionDetail: {
                    owner: "AccountId",
                    name: "Vec<u8>",
                    metadataScheme: "Vec<u8>",
                    royaltiesSchedule: "Option<Vec<(T::AccountId, Permill)>>",
                    maxIssuance: "Option<u32>",
                    originChain: "Text",
                    nextSerialNumber: "u32",
                    collectionIssuance: "u32",
                    crossChainCompatibility: "CrossChainCompatibility",
                },
                CrossChainCompatibility: {
                    xrpl: "bool",
                },
                AccountId: "EthereumAccountId",
                AccountId20: "EthereumAccountId",
                AccountId32: "EthereumAccountId",
                Address: "AccountId",
                LookupSource: "AccountId",
                Lookup0: "AccountId",
                AssetId: "u32",
                Balance: "u128",
                DataPermission: "Text",
                PermissionReferenceRecord: {
                    permission_record_id: "Text",
                    resolvers: "Vec<(Text, Vec<Text>)>",
                },
                GetPermissionsResult: {
                    permissions: "Vec<(Text, Vec<DataPermission>)>",
                    permission_reference: "Option<PermissionReferenceRecord>",
                },
                XRPLTxData: {
                    _enum: {
                        Payment: {
                            amount: "Balance",
                            destination: "H160",
                        },
                        CurrencyPayment: {
                            amount: "Balance",
                            address: "H160",
                            currencyId: "H256",
                        },
                    },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any,
                XrplEventProofResponse: {
                    event_id: "EventProofId",
                    signatures: "Vec<Bytes>",
                    validators: "Vec<Bytes>",
                    validator_set_id: "ValidatorSetId",
                    block: "H256",
                    tag: "Option<Bytes>",
                },
            }
        };
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
        console.log('range::',range);
        const blockTracker: BlockTracker | null = await prisma.blockTracker.findFirst() as unknown as BlockTracker;
        const blockScanned = blockTracker?.blockScanned || -1;
        const currentRange: Range = blockTracker ? { from: blockScanned + 1 } : range;
        console.log("Range::", currentRange);
        range.from = blockScanned;
        let parser = new Parser(
            new raw.Rpc(this.rpc()),
            [{
                range: range,
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
            //yield toJSON(blocks)
            const blockDetails = toJSON(blocks)
            // console.log('blockDetails:',JSON.stringify(blockDetails));
            await addToDB(blockDetails);
        }
    }

    protected getBlockHeight(block: any): number {
        return block.header.height || 0
    }

    protected getBlockTimestamp(block: any): number {
        return Math.floor(block.header.timestamp / 1000) || 0
    }
}
