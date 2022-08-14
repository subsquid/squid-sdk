import { Command, Flags } from '@oclif/core';

export default class Tail extends Command {
    static description = 'Getting logs about version';
    static hidden = true;
    static deprecated = true;
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
        this.log('Tail command is deprecated');
        this.log('Please use `sqd squid logs` instead');
        this.log('');
        this.log('You can find documentation by running `sqd squid logs --help`');
    }
}
