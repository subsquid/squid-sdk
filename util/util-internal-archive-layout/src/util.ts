export function getShortHash(hash: string): string {
    if (hash.startsWith('0x')) {
        return hash.slice(2, 8)
    } else {
        return hash.slice(0, 5)
    }
}


export function formatBlockNumber(height: number): string {
    return String(height).padStart(10, '0')
}
