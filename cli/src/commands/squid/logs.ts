import { Flags } from '@oclif/core';
import chalk from 'chalk';
import { LogEntry, LogLevel, LogPayload, versionHistoryLogs, versionTailLogs } from '../../api';
import { CliCommand } from '../../command';
import { prompt } from 'inquirer';
import { createInterface } from 'readline';

function getLevel(level: LogLevel) {
    switch (level) {
        case LogLevel.Debug:
            return chalk.gray(level)
        case LogLevel.Info:
        case LogLevel.Notice:
            return chalk.cyan(level)
        case LogLevel.Warning:
            return chalk.yellow(level)
        case LogLevel.Error:
            return chalk.red(level)
    }
}

function streamLines(body: NodeJS.ReadableStream, cb: (line: string) => void): void {
    const rl = createInterface({
        input: body,
        crlfDelay: Infinity
    })



    rl.on('line', cb)
}

function getPayload(payload: LogPayload) {
    if (typeof payload === 'string') {
       return payload || ''
    }

    const { message, ...rest } = payload;
    const res = [message];

    // log if message is empty or some additional data exists
    if(!message || Object.keys(rest).length !== 0) {
        res.push(chalk.dim(JSON.stringify(rest)))
    }
    return res.filter(v => Boolean(v)).join(' ')
}

type LogResult = {
    hasLogs: boolean,
    nextPage: string | null
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
            name: 'version',
            char: 'v',
            description: `Version name`,
            required: false,
            default: 'prod'
        }),
        pageSize: Flags.integer({
            char: 'p',
            description: 'Logs page size',
            required: false,
            default: 100,
            exclusive: ['tail']
        }),
        tail: Flags.boolean({
            char: 't',
            description: 'Tail',
            required: false,
            default: false,
        }),
    };

    async run(): Promise<void> {
        const { flags: { tail, pageSize, versionName }, args: { name } } = await this.parse(Logs);
        const from = new Date(Date.now() - 24 * 60 * 60000);

        this.log('Fetching logs...')

        if (tail) {
            await this.fetchLogs(name, versionName, {
                limit: 30,
                from,
                reverse: true
            })

            const stream = await versionTailLogs(name, versionName);
            await new Promise((resolve, reject) => {
                streamLines(stream, (line) => {
                    if (line.length === 0) return

                    try {
                        const entries: LogEntry[] = JSON.parse(line)

                        entries.forEach(e => {
                            this.prettyPrint(e)
                        })
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
            const { hasLogs, nextPage }: LogResult = await this.fetchLogs(name, versionName, {
                limit: pageSize,
                from,
                nextPage: cursor
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

    async fetchLogs(squidName: string, versionName : string, { reverse, ...query }: {
        limit: number,
        from: Date,
        nextPage?: string,
        orderBy?: string,
        reverse?: boolean
    }): Promise<LogResult> {
        let { logs, nextPage } = await versionHistoryLogs(squidName, versionName, query);
        if (reverse) {
            logs = logs.reverse()
        }
        logs.forEach(l => {
            this.prettyPrint(l)
        });

        return { hasLogs: logs.length > 0,  nextPage }
    }


    prettyPrint(log: LogEntry) {
        this.log(`${chalk.dim(log.timestamp)} ${getLevel(log.level)} ${getPayload(log.payload)}`);
    }
}
