import { api, HttpResponse, SquidResponse, waitDeploy } from '../../api';
import { CliCommand } from '../../command';

export default class Prod extends CliCommand {
    static description = 'Change Squid production version';

    static args = [
        {
            name: 'squid',
            description: '<name>',
            required: true,
        },
        {
            name: 'version',
            description: '<name>',
            required: true,
        },
    ];

    async run(): Promise<void> {
        const { args: { squid, version } } = await this.parse(Prod);

        const { body } = await api<HttpResponse<SquidResponse>>( {
            method: 'put',
            path: `/client/squids/${squid}/versions/${version}/production`
        });

        if (body.payload?.deploy) {
            await waitDeploy(this, body)
        }

        this.log('✔️ Done!');
    }
}


