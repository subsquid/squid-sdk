import {createLogger, Logger} from "@subsquid/logger"
import {assertNotNull, def, runProgram} from "@subsquid/util-internal"
import assert from "assert"
import axios from "axios"
import { Log, Block, Transaction } from "./eth"
import { LogFieldSelection } from "./fieldSelection"

export class EthProcessor<Store> {
	protected hooks: { evmLog: Array<EvmLogHandlerEntry<Store>> }
	private blockRange: Range
	private batchSize: number
	private src?: DataSource
	private running: boolean
	private db: Database<Store>

	constructor(db: Database<Store>) {
		this.hooks = {evmLog: []}
		this.blockRange = { from: 0 }
		this.batchSize = 100
		this.db = db
		this.running = false
	}

	/**
     * Sets blockchain data source.
     *
     * @example
     * processor.setDataSource({
     *     archive: 'https://eth.indexer.gc.subsquid.io'
     * })
     */
	setDataSource(src: DataSource): void {
		this.assertNotRunning()
		this.src = src
	}

	/**
     * Limits the range of blocks to be processed.
     *
     * When the upper bound is specified,
     * the processor will terminate with exit code 0 once it reaches it.
     *
     * @example
     * // process only block 100
     * processor.setBlockRange({
     *     from: 100,
     *     to: 100
     * })
     */
	setBlockRange(range: Range): void {
		this.assertNotRunning()
		this.blockRange = range
	}

	/**
     * Sets the maximum number of blocks which can be fetched
     * from the data source in a single request.
     *
     * The default is 100.
     *
     * Usually this setting doesn't have any significant impact on the performance.
     */
    setBatchSize(size: number): void {
        this.assertNotRunning()
        assert(size > 0)
        this.batchSize = size
    }

    addEvmLogHandler(
    	contractAddress: string,
    	options: EvmLogOptions,
    	fn: EvmLogHandler<Store>
    ): void {
    	this.assertNotRunning()
    	this.hooks.evmLog.push({
    		handler: fn,
    		contractAddress,
    		...options
    	})
    }

    protected assertNotRunning(): void {
        if (this.running) {
            throw new Error('Settings modifications are not allowed after start of processing')
        }
    }

    @def
    private getLogger(): Logger {
        return createLogger('sqd:processor')
    }

    private getDatabase() {
        return this.db
    }

    private getArchiveEndpoint(): string {
        let url = this.src?.archive
        if (url == null) {
            throw new Error('use .setDataSource() to specify archive url')
        }
        return url
    }
    
    private async runImpl(): Promise<void> {
		const db = this.getDatabase();
		const archiveEndpoint = this.getArchiveEndpoint();

		await db.connect()

		const from: number = this.blockRange.from;
		let to: number;
		if (this.blockRange.to) {
			to = this.blockRange.to;
		} else {
			const status = await axios.get(`${archiveEndpoint}/status`);
			to = status.data.number
		}
		
		for (let start=from; start<to; start += this.batchSize) {
			const end = start + this.batchSize > to ? to : start + this.batchSize;

			const hook = this.hooks.evmLog[0];

			const req = {
				from_block: start,
				to_block: end,
				address: hook.contractAddress,
				returnFields: hook.fieldSelection,
			};

			const { data: logs } = await axios.post(`${archiveEndpoint}/status`, req);
		
			for(const rawLog of logs) {
				const log = logFromRaw(rawLog);
				await hook.handler({
					db: this.db,
					log,
				})
			}
		}
	}

    run(): void {
    	if(this.running) {
    		return
    	}
    	this.running = true
    	runProgram(async () => {
    		await this.runImpl()
    	}, err => {
    		this.getLogger().fatal(err)
    	})
    }
}

function logFromRaw(raw: any): Log {
	return {
		tx: {},
		block: {},
	}
}

export interface Range {
    from: number
    to?: number
}

export interface Options {
    batchSize?: number
    blockRange?: Range
}

export interface Database<S> {
    connect(): Promise<number>
    transact(from: number, to: number, cb: (store: S) => Promise<void>): Promise<void>
    advance(height: number): Promise<void>
}

export interface DataSource {
	archive: string
}

export interface EvmLogOptions {
	fieldSelection: LogFieldSelection
}

type EvmLogHandlerEntry<Store> = {
	handler: EvmLogHandler<Store>,
	contractAddress: string,
} & EvmLogOptions

export interface EvmLogHandler<Store> {
    (ctx: EvmLogHandlerContext<Store>): Promise<void>
}

export interface EvmLogHandlerContext<Store> {
	db: Database<Store>,
	log: Log,
}