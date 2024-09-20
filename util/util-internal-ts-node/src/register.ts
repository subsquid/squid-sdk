
export async function registerTsNodeIfRequired(): Promise<void> {
    if (process.env['SQD_TS_NODE'] === 'true') {
        await import('ts-node/register' as string)
    }
}
