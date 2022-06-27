import { Command, Flags } from '@oclif/core';
import { log } from '../../rest-client/routes/log';
import { parseNameAndVersion } from '../../utils';

export default class Tail extends Command {
    static description = 'Getting logs about version';
    static hidden = true;
    static args = [
        {
            name: 'nameAndVersion',
            description: 'name@version',
            required: true,
        },
    ];

    static flags = {
        follow: Flags.boolean({
            char: 'f',
            description: 'will continue streaming the new logs',
            required: false,
            default: false,
        }),
        lines: Flags.integer({
            char: 'l',
            description:
                'output a specific number of lines (if "follow" is not set)',
            required: false,
            default: 50,
        }),
    };

    async run(): Promise<void> {
        const { flags, args } = await this.parse(Tail);
        const nameAndVersion = args.nameAndVersion;
        const { squidName, versionName } = parseNameAndVersion(
            nameAndVersion,
            this
        );
        const follow = flags.follow;
        const lines = flags.lines;

        this.log('Fetching logs...');
        await log(squidName, versionName, follow, lines);
    }
}
