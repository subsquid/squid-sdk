import dotenv from "dotenv"
import {Server} from "./server"

export function main(): void {
    dotenv.config()
    new Server().run()
}

