import { setProduction } from '../../api/alias';
import { parseNameAndVersion } from '../../utils';
import { CliCommand } from '../../command';
import inquirer from 'inquirer';
import { getSquid } from '../../api';

export default class Prod extends CliCommand {
    static description = 'Promote version to production';
    static hidden = true;
    static deprecated = true;
    static args = [
        {
            name: 'nameAndVersion',
            description: 'name@version',
            required: true,
        },
    ];

    async run(): Promise<void> {
        const { args } = await this.parse(Prod);

        const { squidName, versionName } = parseNameAndVersion(
          args.nameAndVersion,
          this
        );

        const foundSquid = await getSquid(squidName, versionName);

        const { confirm } = await inquirer
          .prompt([
            { name: 'confirm', type: 'confirm', message: `Your squid "${foundSquid.name}" version "${foundSquid.versions[0].name}" will be promoted to a production. Are you sure?` },
          ])
        if(!confirm) return

        const squid = await setProduction(squidName, versionName);

        this.log(`Your squid is promoted to production and will be accessible soon at ${squid.versions[0].deploymentUrl}.`)
    }
}
