import {Chain} from "./chain"


async function main(): Promise<void> {
    let chain = new Chain(process.argv[2])
    switch(process.argv[3]) {
        case 'save-events':
            return chain.saveEvents()
        case 'save-events-by-polka':
            return chain.saveEventsByPolka()
        case 'test-events-decoding':
            return chain.testEventsDecoding()
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
