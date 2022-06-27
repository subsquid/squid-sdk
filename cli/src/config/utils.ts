import {
    existsSync,
    mkdirSync, readFileSync,
    writeFileSync
} from 'fs';
import { homedir } from 'os';
import { resolve } from 'path';

export const configDirectory = resolve(homedir(), '.hydra-cli');
export const configFilePath = resolve(configDirectory, 'config.json');

export const defaultApiUrl = 'https://saas.infra.gc.subsquid.io/api';


function writeDefaultConfigData() {

    const defaultConfigData = {
        apiUrl: defaultApiUrl,
        credentials: 'empty'
    };

    writeFileSync(
        configFilePath,
        JSON.stringify(defaultConfigData),
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
    let config;
    try {
        config = JSON.parse(readFileSync(configFilePath, 'utf8'));
    } catch (e) {
        writeDefaultConfigData();
    }
}

export function getConfigField(name: string): any {
    normalizeDefaults();
    return JSON.parse(readFileSync(configFilePath, 'utf8'))[name];
}


export function getConfig(): any {
    normalizeDefaults();
    return JSON.parse(readFileSync(configFilePath, 'utf8'));
}
