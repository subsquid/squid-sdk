
export function getOrGenerateSquidId(): string {
    return process.env.SQUID_ID || `gen-${randomString(10)}`
}


function randomString(len: number) {
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < len; i++) {
        result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
}
