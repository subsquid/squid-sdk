import {Pool} from "pg"
import {createPoolConfig} from "./db"
import {serve} from "./server"
import {loadModel} from "./tools"

function main() {
    let args = process.argv.slice(2)

    if (args.indexOf('--help') >= 0) {
        help()
        process.exit(1)
    }

    if (args.length != 1) {
        help()
        process.exit(1)
    }

    let model = loadModel(args[0])
    let db = new Pool(createPoolConfig())
    let port = parseInt(process.env.GRAPHQL_SERVER_PORT!, 10) || 3000

    serve({model, db, port}).then(
        () => {
            console.log('OpenReader is listening on port ' + port)
        },
        err => {
            console.error(err)
            process.exit(1)
        }
    )
}


function help() {
    console.error(`
Usage:  openreader SCHEMA

OpenCRUD GraphQL server.

Can be configured using the following environment variables:

    DB_NAME
    DB_USER
    DB_PASS
    DB_HOST
    DB_PORT
    GRAPHQL_SERVER_PORT
`)
}

export default main