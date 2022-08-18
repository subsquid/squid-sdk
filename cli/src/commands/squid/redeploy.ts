import { Flags } from '@oclif/core';
import { redeploySquid } from '../../api';
import { CliCommand } from '../../command';
import {
    parseNameAndVersion,
} from '../../utils';
import { getEnv, mergeEnvWithFile } from './release';


export default class Redeploy extends CliCommand {
    static description = 'Restart a squid version';
    static args = [
        {
            name: 'nameAndVersion',
            description: 'name@version',
            required: true,
        },
    ];

    static flags = {
        env: Flags.string({
            char: 'e',
            description: 'environment variable',
            required: false,
            multiple: true,
        }),
        envFile: Flags.string({
            description: 'file with environment variables',
            required: false,
        }),
    };

    async run(): Promise<void> {
        const { flags, args } = await this.parse(Redeploy);
        const nameAndVersion = args.nameAndVersion;
        const { squidName, versionName } = parseNameAndVersion(
            nameAndVersion,
            this
        );

        let envs: Record<string, string> = {};
        
        flags.env?.forEach((e: string)=>{
            const { name, value } = getEnv(e);
            envs[name] = value;
        });
        
        if (flags.envFile != undefined)
            envs = mergeEnvWithFile(envs, flags.envFile);

        await redeploySquid(squidName, versionName, envs);
    }
}
