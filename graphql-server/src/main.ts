import {runProgram} from "@subsquid/util-internal"
import {waitForInterruption} from "@subsquid/util-internal-http-server"
import {Server} from "./server"


runProgram(async () => {
    let server = await new Server().start()
    return waitForInterruption(server)
})

