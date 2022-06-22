import { Flags } from '@oclif/core';
import { dim } from 'chalk';
import { prompt } from 'inquirer'

import { api, HttpResponse, SquidResponse, waitDeploy } from '../../api';
import { CliCommand } from '../../command';
import { getSquidByManifest } from '../../api/manifests';

export default class Deploy extends CliCommand {
    static description = 'Deploy a squid from manifest file';

    static flags = {
        create:  Flags.boolean({
            name: 'create',
            char: 'c',
            helpGroup: 'Action',
            summary:  `Create a new version`,
            required: false,
            exclusive: ['update']
        }),
        update:  Flags.string({
            name: 'update',
            char: 'u',
            helpGroup: 'Action',
            summary:  `Update a specific version`,
            required: false,
        }),
        source: Flags.string({
            char: 's',
            helpGroup: 'Repository',
            summary:  `Github repository URL`,
            description: [
                `Examples:`,
                ` - https://github.com/subsquid/squid-template`,
                ` - git@github.com:subsquid/squid-template.git`,
                ` - https://github.com/subsquid/squid-template.git`
            ].join('\n'),
            required: true,
        }),
        branch: Flags.string({
            char: 'b',
            helpGroup: 'Repository',
            summary: 'Github repository branch',
            required: true,
        }),
        verbose: Flags.boolean({
            char: 'v',
            summary: 'Verbose',
            required: false,
            default: false,
        }),
        noWait: Flags.boolean({
            summary: 'Do not wait until deploy is finished',
            required: false,
            default: false,
        }),
    };

    async run(): Promise<void> {
        let { flags: { source, branch, verbose, update, create, noWait } } = await this.parse(Deploy);
        const artifactUrl =  `${source}#${branch}`;

        if (!update && !create) {
            const res = await getSquidByManifest({artifactUrl}).catch(e => {
                if (e.status === 404) {
                    return { squid: null }
                }

                throw e
            })

            if(res?.squid) {
                const responses: any = await prompt([{
                    name: 'action',
                    message: `Squid ${res.squid?.name}`,
                    type: 'list',
                    choices: [
                        {name: 'Create a new version'},
                        ...res.squid.versions.map(({name, alias}) => ({
                            name: `Update ${alias || name} version ${alias ? dim(`(${name})`) : ''}`,
                            value: name
                        }))
                    ],
                }])

                if (responses.action === 'Create a new version') {
                    const { approve } = await prompt([{
                        name: 'approve',
                        type: 'confirm',
                        message: `A new squid version will be created, are you sure?`
                    }]);

                    if (!approve) return
                } else {
                    update = responses.action
                }
            }
        }

        const { body } = await api<HttpResponse<SquidResponse>>( {
            method: update ?  'put' : 'post',
            path: update ? `/client/squids/versions/${update}` : `/client/squids/versions`,
            data: {
                artifactUrl: `${source}#${branch}`
            }
        });

        this.log('◷ The new squid will be available as soon as the deployment is complete.');

        if (noWait) return

        this.log(
          '◷ You may now detach from the build process by pressing Ctrl + C. The Squid deployment will continue uninterrupted.'
        );
        await waitDeploy(this, body, {verbose});
        this.log('✔️ Done!');
    }
}

