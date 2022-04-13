import { ResilientRpcClient } from "@subsquid/rpc-client/lib/resilient";
import {
  getOldTypesBundle,
  OldTypesBundle,
  readOldTypesBundle,
} from "@subsquid/substrate-metadata";
import { assertNotNull, toCamelCase } from "@subsquid/util";
import assert from "assert";
import { createBatches, DataHandlers, getBlocksCount } from "./batch";
import { ChainManager } from "./chain";
import { Db, IsolationLevel } from "./db";
import { DataBatch, Ingest } from "./ingest";
import { EvmLogEvent, EvmLogHandler, EvmTopicSet } from "./interfaces/evm";
import {
  BlockHandler,
  BlockHandlerContext,
  EventHandler,
  ExtrinsicHandler,
} from "./interfaces/handlerContext";
import { Hooks } from "./interfaces/hooks";
import { QualifiedName, SubstrateEvent } from "./interfaces/substrate";
import { ProgressTracker } from "./progress-tracker";
import { Prometheus } from "./prometheus";
import { timeInterval } from "./util/misc";
import { Range } from "./util/range";
import { ServiceManager } from "./util/sm";

/**
 * Interface used to specify a range of blocks to be processed by BlockHook functions
 *
 * @property range: A {@link Range}, specifying a starting and (optionally) end block for processing. Optional.
 */
export interface BlockHookOptions {
  range?: Range;
}

/**
 * Interface used to specify a range of blocks to be processed by Event Handler functions
 *
 * @property range: A {@link Range}, specifying a starting and (optionally) end block for processing. Optional.
 */
export interface EventHandlerOptions {
  range?: Range;
}

/**
 * Interface used to specify to Extrinsig Handler functions:
 *  * a range of blocks to be processed by Extrinsic Handler functions
 *  * a list of names of the events triggered by the Extrinsic. Will be used to
 *
 * @property range: A {@link Range}, specifying a starting and (optionally) end block for processing. Optional.
 * @property triggerEvents: A list of {@link QualifiedName}, indicating Event names triggered by the Extrinsic. Optional.
 */
export interface ExtrinsicHandlerOptions {
  range?: Range;
  triggerEvents?: QualifiedName[];
}

/**
 * Interface used to specify to the {@link SubstrateProcessor} the endpoints of Subsquid Archive and blockchain WebSocket.
 *
 * @property archive: a string, representing the URL of a Subsquid Archive endpoint
 * @property chain: a string, representing the URL of a blockchain WebSocket (e.g. 'wss://')
 */
export interface DataSource {
  /**
   * Archive endpoint URL
   */
  archive: string;
  /**
   * Chain node RPC websocket URL
   */
  chain: string;
}

/* It takes a list of handlers and a range of blocks, and runs the handlers on the blocks */
/**
 * Class responsible for coordinating the block ingestion loop and triggering handler functions.
 * The class exposes functions to configure its execution and add handler functions.
 */
export class SubstrateProcessor {
  protected hooks: Hooks = {
    pre: [],
    post: [],
    event: [],
    extrinsic: [],
    evmLog: [],
  };
  private blockRange: Range = { from: 0 };
  private batchSize = 100;
  private prometheusPort?: number | string;
  private src?: DataSource;
  private typesBundle?: OldTypesBundle;
  private isolationLevel?: IsolationLevel;
  private running = false;

  /**
   * Instantiates the {@link SubstrateProcessor} class, given a name, which will be used to store the progress on the database
   *
   * @param name name of the processor instance. If multiple processors are instantiated within the same project, each `name` should be unique.
   */
  constructor(private name: string) {}

  /**
   * Method used to configure the data source for the processor. The parameter object should provide URLs for the Subsquid Archive and the blockchain WebSocket
   *
   * @param src an object with `archive` and `chain` strings, defining URLs for the Subsquid Archive and the blockchain WebSocket. @see DataSource
   */
  setDataSource(src: DataSource): void {
    this.assertNotRunning();
    this.src = src;
  }

  /**
   * Method used to configure the types bundle of the blockchain being processed. This is necessary to correctly parse chain blocks.
   *
   * @param bundle Either a `string` or an {@link OldTypesBundle} object, defining the bundle of types of the blockchain being processed.
   */
  setTypesBundle(bundle: string | OldTypesBundle): void {
    this.assertNotRunning();
    if (typeof bundle == "string") {
      this.typesBundle =
        getOldTypesBundle(bundle) || readOldTypesBundle(bundle);
    } else {
      this.typesBundle = bundle;
    }
  }

  /**
   * Method used to (optionally) set a range of blocks to restrict processing of a blockchain.
   * When used, the processor will start extracting information from the specified `from` block in the {@link Range} object and (optionally) stop at the `to` indicated block.
   * If not set, the processor will default to start from block number 0 and never stop.
   *
   * @param range an object with `from` and (optionally) `to` fields, defining the block numbers to which the chain processing should be restricted. @see Range
   */
  setBlockRange(range: Range): void {
    this.assertNotRunning();
    this.blockRange = range;
  }

  /**
   * Method used to set the size of a block ingestion batch, meaning the number of blocks processed in one cycle.
   * This has performance impacts, as a larger number will require more computational power and more memory. Advised to keep between 200 an 500.
   * If not set, the processor will default to batches of 100 blocks.
   *
   * @param size a number, indicating the number of blocks to be processed in a single ingestion batch
   */
  setBatchSize(size: number): void {
    this.assertNotRunning();
    assert(size > 0);
    this.batchSize = size;
  }

  /**
   * Method used to set the port number for the included Prometheus metrics service.
   *
   * @param port a port number, or a string representing the port number at which the Prometheus service should expose ingestion metrics.
   */
  setPrometheusPort(port: number | string) {
    this.assertNotRunning();
    this.prometheusPort = port;
  }

  /**
   * Method used to set the `isolationLevel` of the instance when creating the Database connection.
   *
   * @param isolationLevel an object of type {@link IsolationLevel}, used to configure the database connection
   */
  setIsolationLevel(isolationLevel?: IsolationLevel): void {
    this.assertNotRunning();
    this.isolationLevel = isolationLevel;
  }

  /**
   * Getter method to return the port number the instance should use to expose Prometheus metrics
   *
   * @returns either this instance's {@link prometheusPort}, or the value of environment variables `PROCESSOR_PROMETHEUS_PORT`, `PROMETHEUS_PORT`. Defaults to 0 otherwise.
   */
  private getPrometheusPort(): number | string {
    return this.prometheusPort == null
      ? process.env.PROCESSOR_PROMETHEUS_PORT ||
          process.env.PROMETHEUS_PORT ||
          0
      : this.prometheusPort;
  }

  /**
   * Method used to add a {@link BlockHandler} function that should be executed before processing each block. Can accept an additional {@link BlockHookOptions} parameter.
   *
   * @param fn an asynchronous function that implements the {@link BlockHandler} interface, by accepting a {@link BlockHandlerContext} as argument and returning a `Promise<void>`
   */
  addPreHook(fn: BlockHandler): void;
  /**
   * Method used to add a {@link BlockHandler} function that should be executed before processing each block.
   *
   * @param options an object corresponding to the {@link BlockHookOptions} interface, setting the {@link Range} of execution for the `fn` function
   * @param fn an asynchronous function that implements the {@link BlockHandler} interface, by accepting a {@link BlockHandlerContext} as argument and returning a `Promise<void>`
   */
  addPreHook(options: BlockHookOptions, fn: BlockHandler): void;
  /**
   * Method used to add a {@link BlockHandler} function that should be executed before processing each block.
   *
   * @param fnOrOptions
   * @param fn an asynchronous function that implements the {@link BlockHandler} interface, by accepting a {@link BlockHandlerContext} as argument and returning a `Promise<void>`
   */
  addPreHook(
    fnOrOptions: BlockHandler | BlockHookOptions,
    fn?: BlockHandler
  ): void {
    this.assertNotRunning();
    let handler: BlockHandler;
    let options: BlockHookOptions = {};
    if (typeof fnOrOptions == "function") {
      handler = fnOrOptions;
    } else {
      handler = assertNotNull(fn);
      options = fnOrOptions;
    }
    this.hooks.pre.push({ handler, ...options });
  }

  /**
   * Method used to add a {@link BlockHandler} function that should be executed after processing each block. Can accept an additional {@link BlockHookOptions} parameter.
   *
   * @param fn an asynchronous function that implements the {@link BlockHandler} interface, by accepting a {@link BlockHandlerContext} as argument and returning a `Promise<void>`
   */
  addPostHook(fn: BlockHandler): void;
  /**
   * Method used to add a {@link BlockHandler} function that should be executed after processing each block.
   *
   * @param options an object corresponding to the {@link BlockHookOptions} interface, setting the {@link Range} of execution for the `fn` function
   * @param fn an asynchronous function that implements the {@link BlockHandler} interface, by accepting a {@link BlockHandlerContext} as argument and returning a `Promise<void>`
   */
  addPostHook(options: BlockHookOptions, fn: BlockHandler): void;
  /**
   * Method used to add a {@link BlockHandler} function that should be executed after processing each block.
   *
   * @param fnOrOptions either a function implementing the {@link BlockHandler} interface, or an object corresponding to the {@link BlockHookOptions} interface
   * @param fn an asynchronous function that implements the {@link BlockHandler} interface, by accepting a {@link BlockHandlerContext} as argument and returning a `Promise<void>`
   */
  addPostHook(
    fnOrOptions: BlockHandler | BlockHookOptions,
    fn?: BlockHandler
  ): void {
    this.assertNotRunning();
    let handler: BlockHandler;
    let options: BlockHookOptions = {};
    if (typeof fnOrOptions == "function") {
      handler = fnOrOptions;
    } else {
      handler = assertNotNull(fn);
      options = fnOrOptions;
    }
    this.hooks.post.push({ handler, ...options });
  }

  /**
   * Method used to add an {@link EventHandler} function that should be executed when an Event with the specified name is encountered. Can accept an additional {@link EventHandlerOptions} parameter.
   * 
   * @param eventName a {@link QualifiedName} (a string), representing the name of the Event of interest. When such Event is encountered, the provided function is executed.
   * @param fn an asynchronous function that implements the {@link EventHandler} interface, by accepting a {@link EventHandlerContext} as argument and returning a `Promise<void>`
   */
  addEventHandler(eventName: QualifiedName, fn: EventHandler): void;
  /**
   * Method used to add an {@link EventHandler} function that should be executed when an Event with the specified name is encountered.
   * 
   * @param eventName a {@link QualifiedName} (a string), representing the name of the Event of interest. When such Event is encountered, the provided function is executed.
   * @param options an object corresponding to the {@link EventHandlerOptions} interface, setting the {@link Range} of execution for the `fn` function
   * @param fn an asynchronous function that implements the {@link EventHandler} interface, by accepting a {@link EventHandlerContext} as argument and returning a `Promise<void>`
   */
  addEventHandler(
    eventName: QualifiedName,
    options: EventHandlerOptions,
    fn: EventHandler
  ): void;
  /**
   * Method used to add an {@link EventHandler} function that should be executed when an Event with the specified name is encountered. Can accept an additional {@link EventHandlerOptions} parameter.
   * 
   * @param eventName a {@link QualifiedName} (a string), representing the name of the Event of interest. When such Event is encountered, the provided function is executed.
   * @param fnOrOptions either a function implementing the {@link EventHandler} interface, or an object corresponding to the {@link EventHandlerOptions} interface
   * @param fn an asynchronous function that implements the {@link EventHandler} interface, by accepting a {@link EventHandlerContext} as argument and returning a `Promise<void>`
   */
  addEventHandler(
    eventName: QualifiedName,
    fnOrOptions: EventHandlerOptions | EventHandler,
    fn?: EventHandler
  ): void {
    this.assertNotRunning();
    let handler: EventHandler;
    let options: EventHandlerOptions = {};
    if (typeof fnOrOptions === "function") {
      handler = fnOrOptions;
    } else {
      handler = assertNotNull(fn);
      options = fnOrOptions;
    }
    this.hooks.event.push({
      event: eventName,
      handler,
      ...options,
    });
  }

  /**
   * Method used to add an {@link ExtrinsicHandler} function that should be executed when an Event with the specified name is encountered. Can accept an additional {@link ExtrinsicHandlerOptions} parameter.
   * 
   * @param extrinsicName a {@link QualifiedName} (a string), representing the name of the Event of interest. When such Event is encountered, the provided function is executed.
   * @param fn an asynchronous function that implements the {@link ExtrinsicHandler} interface, by accepting a {@link ExtrinsicHandlerContext} as argument and returning a `Promise<void>`
   */
  addExtrinsicHandler(extrinsicName: QualifiedName, fn: ExtrinsicHandler): void;
  /**
   * Method used to add an {@link ExtrinsicHandler} function that should be executed when an Event with the specified name is encountered.
   * 
   * @param extrinsicName a {@link QualifiedName} (a string), representing the name of the Event of interest. When such Event is encountered, the provided function is executed.
   * @param options an object corresponding to the {@link ExtrinsicHandlerOptions} interface, setting the {@link Range} of execution for the `fn` function
   * @param fn an asynchronous function that implements the {@link ExtrinsicHandler} interface, by accepting a {@link ExtrinsicHandlerContext} as argument and returning a `Promise<void>`
   */
  addExtrinsicHandler(
    extrinsicName: QualifiedName,
    options: ExtrinsicHandlerOptions,
    fn: ExtrinsicHandler
  ): void;
  /**
   * Method used to add an {@link ExtrinsicHandler} function that should be executed when an Event with the specified name is encountered. Can accept an additional {@link ExtrinsicHandlerOptions} parameter.
   * 
   * @param extrinsicName a {@link QualifiedName} (a string), representing the name of the Event of interest. When such Event is encountered, the provided function is executed.
   * @param fnOrOptions either a function implementing the {@link ExtrinsicHandler} interface, or an object corresponding to the {@link ExtrinsicHandlerOptions} interface
   * @param fn an asynchronous function that implements the {@link ExtrinsicHandler} interface, by accepting a {@link ExtrinsicHandlerContext} as argument and returning a `Promise<void>`
   */
  addExtrinsicHandler(
    extrinsicName: QualifiedName,
    fnOrOptions: ExtrinsicHandler | ExtrinsicHandlerOptions,
    fn?: ExtrinsicHandler
  ): void {
    this.assertNotRunning();
    let handler: ExtrinsicHandler;
    let options: ExtrinsicHandlerOptions = {};
    if (typeof fnOrOptions == "function") {
      handler = fnOrOptions;
    } else {
      handler = assertNotNull(fn);
      options = { ...fnOrOptions };
    }
    let triggers = options.triggerEvents || ["system.ExtrinsicSuccess"];
    new Set(triggers).forEach((event) => {
      this.hooks.extrinsic.push({
        event,
        handler,
        extrinsic: extrinsicName
          .split(".")
          .map((n) => toCamelCase(n))
          .join("."),
        range: options.range,
      });
    });
  }

  /**
   * Method asserting the status of the processor. If the processor is {@link running}, it will throw an {@link Error}.
   */
  protected assertNotRunning(): void {
    if (this.running) {
      throw new Error(
        "Settings modifications are not allowed after start of processing"
      );
    }
  }

  /**
   * Method to launch the processing of the blockchain, after having configured the class' instance.
   * 
   * @returns `void`
   */
  run(): void {
    if (this.running) return;
    this.running = true;
    ServiceManager.run((sm) => this._run(sm));
  }

  /**
   * @internal
   * @param sm 
   * @returns 
   */
  private async _run(sm: ServiceManager): Promise<void> {
    let prometheus = new Prometheus();
    let prometheusServer = sm.add(
      await prometheus.serve(this.getPrometheusPort())
    );
    console.log(
      `Prometheus metrics are served at port ${prometheusServer.port}`
    );

    let db = sm.add(
      await Db.connect({
        processorName: this.name,
        isolationLevel: this.isolationLevel,
      })
    );

    let { height: heightAtStart } = await db.init();

    prometheus.setLastProcessedBlock(heightAtStart);

    let blockRange = this.blockRange;
    if (blockRange.to != null && blockRange.to < heightAtStart + 1) {
      return;
    } else {
      blockRange = {
        from: Math.max(heightAtStart + 1, blockRange.from),
        to: blockRange.to,
      };
    }

    let batches = createBatches(this.hooks, blockRange);

    let ingest = sm.add(
      new Ingest({
        archive: assertNotNull(
          this.src?.archive,
          "use .setDataSource() to specify archive url"
        ),
        batches$: batches,
        batchSize: this.batchSize,
        metrics: prometheus,
      })
    );

    let client = sm.add(
      new ResilientRpcClient(
        assertNotNull(
          this.src?.chain,
          "use .setDataSource() to specify chain RPC endpoint"
        )
      )
    );

    let wholeRange = createBatches(this.hooks, this.blockRange);
    let progress = new ProgressTracker(
      getBlocksCount(wholeRange, heightAtStart),
      wholeRange,
      prometheus
    );

    await this.process(
      ingest,
      new ChainManager(client, this.typesBundle),
      db,
      prometheus,
      progress
    );
  }

  /**
   * Method to perform the actual processing the blockchain. Uses the {@link Ingest} class to obtain blocks in batches, then triggers the configured pre/post block handlers, as well as any Event and Extrinsic handlers that should be triggered.
   * The `Db` class is used to interface with the Database and the `Prometheus` one to manage the metrics service.
   * 
   * This is a private method, it should never be called manually, use {@link run} method, instead.
   * 
   * @param ingest an {@link Ingest} class instance, needed to manage the inflow of blocks
   * @param chainManager a {@link ChainManager} class instance, needed to manage the blockchain metadata information, through a {@link Chain} class
   * @param db a {@link Db} class instance, used to interface with the Database
   * @param prom a {@link Prometheus} class instance, used to manage the Prometheus metrics service.
   * @param progress a {@link ProgressTracker} class instance, which manages the blockchain processing progress, updated after processing each batch
   */
  private async process(
    ingest: Ingest,
    chainManager: ChainManager,
    db: Db,
    prom: Prometheus,
    progress: ProgressTracker
  ): Promise<void> {
    let batch: DataBatch | null;
    let lastBlock = -1;
    while ((batch = await ingest.nextBatch())) {
      let { handlers, blocks, range } = batch;
      let beg = blocks.length > 0 ? process.hrtime.bigint() : 0n;

      for (let block of blocks) {
        assert(lastBlock < block.block.height);
        let chain = await chainManager.getChainForBlock(block.block);
        await db.transact(block.block.height, async (store) => {
          let ctx: BlockHandlerContext = {
            _chain: chain,
            store,
            ...block,
          };

          for (let pre of handlers.pre) {
            await pre(ctx);
          }

          for (let event of block.events) {
            let extrinsic = event.extrinsic;

            for (let eventHandler of handlers.events[event.name] || []) {
              await eventHandler({ ...ctx, event, extrinsic });
            }

            for (let evmLogHandler of this.getEvmLogHandlers(
              handlers.evmLogs,
              event
            )) {
              let log = event as EvmLogEvent;
              await evmLogHandler({
                contractAddress: log.evmLogAddress,
                topics: log.evmLogTopics,
                data: log.evmLogData,
                txHash: log.evmHash,
                substrate: { ...ctx, event, extrinsic },
                store,
              });
            }

            if (extrinsic == null) continue;
            for (let callHandler of handlers.extrinsics[event.name]?.[
              extrinsic.name
            ] || []) {
              await callHandler({ ...ctx, event, extrinsic });
            }
          }

          for (let post of handlers.post) {
            await post(ctx);
          }
        });

        lastBlock = block.block.height;
        prom.setLastProcessedBlock(lastBlock);
      }

      if (lastBlock < range.to) {
        lastBlock = range.to;
        await db.setHeight(lastBlock);
        prom.setLastProcessedBlock(lastBlock);
      }

      let end = process.hrtime.bigint();
      progress.batch(end, batch);

      let status: string[] = [];
      status.push(`Last block: ${lastBlock}`);
      if (blocks.length > 0) {
        let speed = (blocks.length * Math.pow(10, 9)) / Number(end - beg);
        let roundedSpeed = Math.round(speed);
        status.push(`mapping: ${roundedSpeed} blocks/sec`);
        prom.setMappingSpeed(speed);
      }
      status.push(`ingest: ${Math.round(prom.getIngestSpeed())} blocks/sec`);
      status.push(`eta: ${timeInterval(progress.getSyncEtaSeconds())}`);
      status.push(`progress: ${Math.round(progress.getSyncRatio() * 100)}%`);
      console.log(status.join(", "));
    }
  }

  /** @internal */
  private *getEvmLogHandlers(
    evmLogs: DataHandlers["evmLogs"],
    event: SubstrateEvent
  ): Generator<EvmLogHandler> {
    if (event.name != "evm.Log") return;
    let log = event as EvmLogEvent;

    let contractHandlers = evmLogs[log.evmLogAddress];
    if (contractHandlers == null) return;

    for (let h of contractHandlers) {
      if (this.evmHandlerMatches(h, log)) {
        yield h.handler;
      }
    }
  }

  /** @internal */
  private evmHandlerMatches(
    handler: { filter?: EvmTopicSet[] },
    log: EvmLogEvent
  ): boolean {
    if (handler.filter == null) return true;
    for (let i = 0; i < handler.filter.length; i++) {
      let set = handler.filter[i];
      if (set == null) continue;
      if (Array.isArray(set) && !set.includes(log.evmLogTopics[i])) {
        return false;
      } else if (set !== log.evmLogTopics[i]) {
        return false;
      }
    }
    return true;
  }
}
