import {Chain} from "./chain"


async function main(): Promise<void> {
    let chain = new Chain(process.argv[2])
    switch(process.argv[3]) {
        case 'save-events':
            return chain.saveEvents()
        case 'test-events-scale-encoding-decoding':
            return chain.testEventsScaleEncodingDecoding()
        case 'test-compare-events-with-polka':
            return chain.testCompareEventsWithPolka()
        case 'select-test-blocks':
            return chain.selectTestBlocks()
        case 'select-test-blocks-from-db':
            return chain.selectTestBlocksFromDb()
    }
}


main().then(
    () => {
        process.exit(0)
    },
    err => {
        console.error(err)
        process.exit(1)
    }
)
