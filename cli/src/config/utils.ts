import {
    existsSync,
    mkdirSync, readFileSync,
    writeFileSync
} from 'fs';
import { homedir } from 'os';
import { resolve } from 'path';

export const configDirectory = resolve(homedir(), '.subsquid-cli');
export const configFilePath = resolve(configDirectory, 'config.json');

export const defaultApiUrl = 'https://saas.infra.gc.subsquid.io/api';

export type Config = {
    apiUrl: string
    credentials: string
}

function writeDefaultConfigData(): Config {
    const defaultConfigData: Config = {
        apiUrl: defaultApiUrl,
        credentials: 'empty'
    };

    writeConfig(defaultConfigData)

    return defaultConfigData
}

function writeConfig(data: Config) {
    writeFileSync(
      configFilePath,
      JSON.stringify(data),
    );
}

function normalizeDefaults(): Config {
    if (!existsSync(configFilePath)) {
        if (!existsSync(configDirectory)) {
            mkdirSync(configDirectory);
        }

        return writeDefaultConfigData();;
    }

    try {
        return JSON.parse(readFileSync(configFilePath, 'utf8'));
    } catch (e) {
       return writeDefaultConfigData();
    }
}

export function setConfig({ credentials, apiUrl }: Partial<Config> & Pick<Config, 'credentials'>): Config {
    const config = normalizeDefaults();

    config.credentials = credentials;

    if (apiUrl) {
        config.apiUrl = apiUrl;
    }

    writeConfig(config);

    return config
}

export function getConfig(): Config {
    return normalizeDefaults();
}

