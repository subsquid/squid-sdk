import process from 'process'


export interface ConnectionOptions {
    host: string
    port: number
    database: string
    schema?: string
    username: string
    password: string
    ssl?: boolean
}


export function createConnectionOptions(): ConnectionOptions {
    return {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
        database: process.env.DB_NAME || 'postgres',
        schema: process.env.DB_SCHEMA || 'public',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASS || 'postgres',
        ssl: process.env.DB_SSL === 'true'
    }
}
