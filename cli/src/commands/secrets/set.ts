import { setSecret } from "../../api";
import { CliCommand } from "../../command";


export default class Set extends CliCommand {
    static description = 'Create or update a secret. The secret will be exposed as an environment variable with the given name to all the squids. Note the changes take affect only after a squid is restarted or updated.';
    static args = [
        {
            name: 'name',
            description: 'The secret name',
            required: true,
        },
        {
            name: 'value',
            description: 'The secret value',
            required: true,
        },
    ];
    static flags = {};

    async run(): Promise<void> {
        const { flags: { }, args: { name, value } } = await this.parse(Set);
        await setSecret({[name]: value});
        this.log(`Secret '${name}' set`);
    }
}