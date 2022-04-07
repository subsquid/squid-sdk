import {SubstrateProcessor} from "@subsquid/substrate-processor"
import {EvmLogHandler, EvmLogHandlerOptions} from "@subsquid/substrate-processor/lib/interfaces/evm"
import {assertNotNull} from "@subsquid/util-internal"


export class SubstrateEvmProcessor extends SubstrateProcessor {
    addEvmLogHandler(contractAddress: string, fn: EvmLogHandler): void
    addEvmLogHandler(contractAddress: string, options: EvmLogHandlerOptions, fn: EvmLogHandler): void
    addEvmLogHandler(contractAddress: string, fnOrOptions: EvmLogHandlerOptions | EvmLogHandler, fn?: EvmLogHandler): void {
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
