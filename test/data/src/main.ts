import {runProgram} from "@subsquid/util-internal"
import {Chain} from "./chain"


runProgram(async () => {
    let chain = new Chain(process.argv[2])
    switch(process.argv[3]) {
        case 'print-metadata': {
            let specVersion = process.argv[4]
            return chain.printMetadata(specVersion && parseInt(specVersion) || undefined)
        }
        case 'save-blocks':
            return chain.saveBlocks()
        case 'save-events':
            return chain.saveEvents()
        case 'test-events-scale-encoding-decoding':
            return chain.testEventsScaleEncodingDecoding()
        case 'test-extrinsics-scale-encoding-decoding':
            return chain.testExtrinsicsScaleEncodingDecoding()
        case 'test-constants-scale-encoding-decoding':
            return chain.testConstantsScaleEncodingDecoding()
    }
})
