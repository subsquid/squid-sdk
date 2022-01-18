import {EvmLogHandlerOptions, SubstrateProcessor} from "./processor";
import {QualifiedName} from "./interfaces/substrate";
import {EvmLogHandler} from "./interfaces/handlerContext";
import {assertNotNull} from "@subsquid/util";

export class MoonriverProcessor extends SubstrateProcessor {

    addEvmLogHandler(contractAddress: QualifiedName, fn: EvmLogHandler): void
    addEvmLogHandler(contractAddress: QualifiedName, options: EvmLogHandlerOptions, fn: EvmLogHandler): void
    addEvmLogHandler(contractAddress: QualifiedName, fnOrOptions: EvmLogHandlerOptions | EvmLogHandler, fn?: EvmLogHandler): void {
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
