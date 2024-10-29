export function getShortHash(hash: string): string {
    return hash.slice(-5)
}


export function formatBlockNumber(height: number): string {
    return String(height).padStart(10, '0')
}
