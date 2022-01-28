import {assertNotNull} from "@subsquid/util";
import {SubstrateProcessor} from "@subsquid/substrate-processor";
import {ContractAddress, EvmLogHandler, EvmLogHandlerOptions} from "./index"

export class MoonbeamProcessor extends SubstrateProcessor {

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
