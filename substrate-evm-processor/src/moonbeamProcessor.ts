import {assertNotNull} from "@subsquid/util";
import {SubstrateProcessor} from "@subsquid/substrate-processor";
import {Fragment, Interface} from "ethers/lib/utils";
import {ContractAddress, EvmLogHandler, EvmLogHandlerOptions, EvmLogHandlerContext} from "./index"
import {eventParser} from "./helpers/contract_events";
import {JsonFragment} from "./interfaces/abi";

export class MoonbeamProcessor extends SubstrateProcessor {

    private readonly abi: Interface;

    constructor(name: string, abi: string | ReadonlyArray<Fragment | JsonFragment | string>) {
        super(name);
        assertNotNull(abi);
        this.abi = new Interface(abi);
    }

    addEvmLogHandler(contractAddress: ContractAddress, fn: EvmLogHandler): void
    addEvmLogHandler(contractAddress: ContractAddress, options: EvmLogHandlerOptions, fn: EvmLogHandler): void
    addEvmLogHandler(contractAddress: ContractAddress, fnOrOptions: EvmLogHandlerOptions | EvmLogHandler, fn?: EvmLogHandler): void {
        this.assertNotRunning()
        let handler: EvmLogHandler
        let options: EvmLogHandlerOptions = {}
        if (typeof fnOrOptions === 'function') {
            handler = fnOrOptions
        } else {
            handler = assertNotNull(fn)
            options = fnOrOptions
        }
        this.hooks.evmLog.push({
            contractAddress,
            handler: (ctx: EvmLogHandlerContext) => {
                if (ctx.data) {
                    ctx.parsedLogs = eventParser(this.abi, ctx.data, ctx.topic || []);
                }
                return handler(ctx);
            },
            ...options
        })
    }

}
