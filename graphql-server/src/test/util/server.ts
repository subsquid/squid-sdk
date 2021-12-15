import {ListeningServer} from "@subsquid/openreader/dist/server"
import {Client} from "gql-test-client"
import {Server} from "../../server"


export function useServer(project: string): Client {
    let client = new Client('not defined')
    let info: ListeningServer | undefined

    before(async () => {
        info = await new Server(project).start()
        client.endpoint = `http://localhost:${info.port}/graphql`
    })

    after(() => info?.stop())

    return client
}
