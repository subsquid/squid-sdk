import {
    existsSync,
    mkdirSync, readFileSync,
    writeFileSync
} from 'fs';
import { homedir } from 'os';
import { resolve } from 'path';
import YAML from 'yaml';

export const configDirectory = resolve(homedir(), '.hydra-cli');
export const configFilePath = resolve(configDirectory, 'config.yaml');

export const defaultApiUrl = 'https://saas.infra.gc.subsquid.io/api';


function writeDefaultConfigData() {

    const defaultConfigData = {
        apiUrl: defaultApiUrl,
        credentials: 'empty'
    };

    writeFileSync(
        configFilePath,
        YAML.stringify(defaultConfigData),
        {
            flag: 'w',
            encoding: 'utf8',
        }
    );
}

export function normalizeDefaults(): void {
    if (!existsSync(configFilePath)) {
        if (!existsSync(configDirectory)) {
            mkdirSync(configDirectory);
        }
        writeDefaultConfigData();
        return;
    }
    const config = YAML.parse(readFileSync(configFilePath, 'utf8'));
    if (typeof config !== 'object') {
        writeDefaultConfigData();
    }
}

export function getConfigField(name: string): any {
    normalizeDefaults();
    return YAML.parse(readFileSync(configFilePath, 'utf8'))[name];
}