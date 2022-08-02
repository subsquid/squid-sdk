import { CliUx, Flags } from '@oclif/core';
import ms from 'ms';

import { streamSquidLogs, versionHistoryLogs } from '../../api';
import { CliCommand } from '../../command';
import { pretty } from '../../logs';
import { parseNameAndVersion } from '../../utils';

type LogResult = {
    hasLogs: boolean,
    nextPage: string | null
}

function parseDate(str: string): Date {
    const date = Date.parse(str);
    if(!isNaN(date)) {
        return new Date(date)
    }

    return new Date(Date.now() - ms(str));
}

export default class Logs extends CliCommand {
    static description = 'Fetch squid logs';
    static args = [
        {
            name: 'name',
            description: 'name@version',
            required: true,
        },
    ];

    static flags = {
        container: Flags.string({
            char: 'c',
            summary: `Container name`,
            required: false,
            multiple: true,
            options: ['processor', 'query-node', 'db-migrate', 'db']
        }),
        pageSize: Flags.integer({
            char: 'p',
            summary: 'Logs page size',
            required: false,
            default: 100,
        }),
        level: Flags.string({
            char: 'l',
            summary: 'Log level',
            required: false,
            multiple: true,
            options: ['error', 'debug', 'info', 'warning']
        }),
        since: Flags.string({
            summary: 'Filter by date/interval',
            required: false,
            default: '1d'
        }),
        follow: Flags.boolean({
            char: 'f',
            summary: 'Follow',
            required: false,
            default: false,
            exclusive: ['fromDate', 'pageSize']
        }),
    };

    async run(): Promise<void> {
        let { flags: { follow, pageSize, container, level, since }, args: { name } } = await this.parse(Logs);

        const fromDate = parseDate(since);

        this.log(`Fetching logs from ${fromDate.toISOString()}...`)

        const { squidName, versionName } = parseNameAndVersion(
          name,
          this
        );

        if (follow) {
            await this.fetchLogs(squidName, versionName, {
                limit: 30,
                from: fromDate,
                reverse: true,
                container,
                level,
            })
            await streamSquidLogs(squidName, versionName,  (l) => this.log(l), { container, level });
            return
        }

        let cursor = undefined
        do {
            const { hasLogs, nextPage }: LogResult = await this.fetchLogs(squidName, versionName, {
                limit: pageSize,
                from: fromDate,
                nextPage: cursor,
                container,
                level,
            })
            if (!hasLogs) {
                this.log('No logs found');
                return;
            }

            if (nextPage) {
                const more = await CliUx.ux.prompt(`type "it" to fetch more logs...`)
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
        reverse?: boolean,
        level?: string[]
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
