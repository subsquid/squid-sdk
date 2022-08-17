import process from "process"


export interface ConnectionOptions {
    host: string
    port: number
    database: string
    username: string
    password: string
}


export function createConnectionOptions(): ConnectionOptions {
    return {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
        database: process.env.DB_NAME || "postgres",
        username: process.env.DB_USER || "postgres",
        password: process.env.DB_PASS || "postgres"
    }
}
