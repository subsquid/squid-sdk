import {SubstrateProcessor} from "@subsquid/substrate-processor"
import {EvmLogHandler, EvmLogSelection} from "@subsquid/substrate-processor/lib/interfaces/evm"
import {assertNotNull} from "@subsquid/util-internal"


interface NoDataSelection {
    data?: undefined
}


export class SubstrateEvmProcessor extends SubstrateProcessor {
    addEvmLogHandler(contractAddress: string, fn: EvmLogHandler): void
    addEvmLogHandler(contractAddress: string, options: EvmLogSelection & NoDataSelection, fn: EvmLogHandler): void
    addEvmLogHandler(contractAddress: string, fnOrOptions: EvmLogSelection & NoDataSelection | EvmLogHandler, fn?: EvmLogHandler): void {
        this.assertNotRunning()
        let handler: EvmLogHandler
        let options: EvmLogSelection & NoDataSelection  = {}
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
