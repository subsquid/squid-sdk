import {ListeningServer} from "@subsquid/util-internal-http-server"
import {Client} from "gql-test-client"
import {Server} from "../../server"


export function useServer(project: string): Client {
    let client = new Client('not defined')
    let info: ListeningServer | undefined

    before(async () => {
        info = await new Server({dir: project}).start()
        client.endpoint = `http://localhost:${info.port}/graphql`
    })

    after(() => info?.close())

    return client
}
