import { Flags } from '@oclif/core';
import chalk from 'chalk';

import { getSquid, LogEntry, versionHistoryLogs, versionTailLogs } from '../../api';
import { CliCommand } from '../../command';
import { prompt } from 'inquirer';
import { createInterface } from 'readline';
import { pretty } from '../../logs';

function streamLines(body: NodeJS.ReadableStream, cb: (line: string) => void): void {
    const rl = createInterface({
        input: body,
        crlfDelay: Infinity
    })

    rl.on('line', cb)
}

type LogResult = {
    hasLogs: boolean,
    nextPage: string | null
}

async function selectVersion(name: string) {
    const squid = await getSquid(name);

    if (squid.versions.length === 1) {
        return squid.versions[0].name
    }

    const { action } = await prompt([{
        name: 'action',
        message: `Select version`,
        type: 'list',
        choices: [
            ...squid.versions.map(({name, alias}) => ({
                name: `${alias || name} version ${alias ? chalk.dim(`(${name})`) : ''}`,
                value: name
            }))
        ],
    }])

    return action
}

export default class Logs extends CliCommand {
    static description = 'Fetch Squid logs';
    static args = [
        {
            name: 'name',
            description: 'Squid name',
            required: true,
        },
    ];

    static flags = {
        versionName: Flags.string({
            char: 'v',
            summary: `Version name`,
            required: false,
        }),
        container: Flags.string({
            char: 'c',
            summary: `Container name`,
            required: false,
            multiple: true
        }),
        pageSize: Flags.integer({
            char: 'p',
            summary: 'Logs page size',
            required: false,
            default: 100,
            exclusive: ['tail']
        }),
        tail: Flags.boolean({
            char: 't',
            summary: 'Tail',
            required: false,
            default: false,
        }),
    };

    async run(): Promise<void> {
        let { flags: { tail, pageSize, versionName, container }, args: { name } } = await this.parse(Logs);
        const from = new Date(Date.now() - 24 * 60 * 60000);

        const version: string = versionName || await selectVersion(name)

        this.log('Fetching logs...')

        if (tail) {
            await this.fetchLogs(name, version, {
                limit: 30,
                from,
                reverse: true,
                container,
            })
            const stream = await versionTailLogs(name, version);
            await new Promise((resolve, reject) => {
                streamLines(stream, (line) => {
                    if (line.length === 0) return

                    try {
                        const entries: LogEntry[] = JSON.parse(line)

                        pretty(entries).forEach(l => {
                            this.log(l)
                        });
                    } catch (e) {
                        reject(e)
                    }
                })

                stream.on('error', reject)
            })

            return
        }

        let cursor = undefined
        do {
            const { hasLogs, nextPage }: LogResult = await this.fetchLogs(name, version, {
                limit: pageSize,
                from,
                nextPage: cursor,
                container,
            })
            if (!hasLogs) {
                this.log('No logs found');
                return;
            }

            if (nextPage) {
                const { more } = await prompt({
                    name: 'more',
                    type: 'input',
                    message: `type "it" to fetch more logs...`,
                })
                if (more !== 'it') {
                    return;
                }
            }

            cursor = nextPage
        } while (cursor)
    }

    async fetchLogs(squidName: string, versionName: string, { reverse, ...query }: {
        limit: number,
        from: Date,
        container: string[],
        nextPage?: string,
        orderBy?: string,
        reverse?: boolean
    }): Promise<LogResult> {
        let { logs, nextPage } = await versionHistoryLogs(squidName, versionName, query);
        if (reverse) {
            logs = logs.reverse()
        }
        pretty(logs).forEach(l => {
            this.log(l)
        });

        return { hasLogs: logs.length > 0,  nextPage }
    }
}
