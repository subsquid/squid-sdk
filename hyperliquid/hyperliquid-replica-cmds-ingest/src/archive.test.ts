import {describe, it, expect} from 'vitest'
import type {Logger} from '@subsquid/logger'
import type {Fs} from '@subsquid/util-internal-fs'
import {HyperliquidArchive} from './archive'


// In-memory archive layout: top (ISO-8601) -> subfolder (YYYYMMDD) -> chunk files.
// A file named `<n>.lz4` holds blocks starting at n + 1.
const LAYOUT: Record<string, Record<string, string[]>> = {
    '2025-01-01T00:00:00Z': {'20250101': ['0.lz4', '100.lz4'], '20250102': ['200.lz4', '300.lz4']},
    '2025-06-01T00:00:00Z': {'20250601': ['400.lz4', '500.lz4']},
    '2026-01-01T00:00:00Z': {'20260101': ['600.lz4', '700.lz4']},
}

function mockFs(listed: string[]): Fs {
    return {
        async ls(...path: string[]): Promise<string[]> {
            listed.push(path.join('/'))
            if (path.length === 0) return Object.keys(LAYOUT)
            if (path.length === 1) return Object.keys(LAYOUT[path[0]] ?? {})
            if (path.length === 2) return [...(LAYOUT[path[0]]?.[path[1]] ?? [])]
            return []
        },
    } as unknown as Fs
}

const log = {debug() {}, child() {return log}} as unknown as Logger

async function collect(archive: HyperliquidArchive, range: {from: number; to: number}): Promise<string[]> {
    let out: string[] = []
    for await (let c of (archive as any).getRawChunks(range) as AsyncIterable<any>) {
        out.push(`${c.top}/${c.subfolder}/${c.filename}`)
    }
    return out
}

describe('HyperliquidArchive.getRawChunks', () => {
    it('does not re-list already-consumed folders on a forward fetch', async () => {
        let listed: string[] = []
        let archive = new HyperliquidArchive(mockFs(listed), log)

        // Consume everything so the cursor advances to the head.
        await collect(archive, {from: 1, to: Infinity})

        listed.length = 0
        // A subsequent forward fetch must resume near the head instead of
        // re-walking the whole archive from the root.
        await collect(archive, {from: 701, to: Infinity})

        expect(listed).not.toContain('2025-01-01T00:00:00Z')
        expect(listed).not.toContain('2025-06-01T00:00:00Z')
        expect(listed.some(p => p.startsWith('2025-01-01T00:00:00Z/'))).toBe(false)
        expect(listed.some(p => p.startsWith('2025-06-01T00:00:00Z/'))).toBe(false)
    })

    it('yields the same chunks with or without a warm cursor', async () => {
        let cold = await collect(new HyperliquidArchive(mockFs([]), log), {from: 450, to: 650})

        let warm = new HyperliquidArchive(mockFs([]), log)
        await collect(warm, {from: 1, to: 250}) // warm the cursor on an earlier range
        let warmChunks = await collect(warm, {from: 450, to: 650})

        expect(warmChunks).toEqual(cold)
        expect(cold).toEqual([
            '2025-06-01T00:00:00Z/20250601/400.lz4',
            '2025-06-01T00:00:00Z/20250601/500.lz4',
            '2026-01-01T00:00:00Z/20260101/600.lz4',
        ])
    })

    it('falls back to a full walk when the range moves backwards', async () => {
        let listed: string[] = []
        let archive = new HyperliquidArchive(mockFs(listed), log)

        await collect(archive, {from: 601, to: 700}) // cursor now near the head
        listed.length = 0
        let chunks = await collect(archive, {from: 1, to: 150}) // rewind

        // A backward request must re-list from the root to find the old chunk.
        expect(listed).toContain('2025-01-01T00:00:00Z')
        expect(chunks).toEqual([
            '2025-01-01T00:00:00Z/20250101/0.lz4',
            '2025-01-01T00:00:00Z/20250101/100.lz4',
        ])
    })
})
