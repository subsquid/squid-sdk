import {EvmLogHandlerOptions, SubstrateProcessor} from "./processor";
import {ContractAddress} from "./interfaces/substrate";
import {EvmLogHandler} from "./interfaces/handlerContext";
import {assertNotNull} from "@subsquid/util";

export class MoonriverProcessor extends SubstrateProcessor {

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
            handler,
            ...options
        })
    }

}
