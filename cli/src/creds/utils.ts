import {
    readFileSync,
    writeFileSync
} from 'fs';
import fetch from 'node-fetch';
import { configFilePath, normalizeDefaults } from '../config';

export function setCreds(creds: string): void {
    normalizeDefaults();
    const config = JSON.parse(readFileSync(configFilePath, 'utf8'));
    config.credentials = creds;
    writeFileSync(configFilePath, JSON.stringify(config), {
        flag: 'w',
        encoding: 'utf8',
    });
}

export function getCreds(): string {
    normalizeDefaults();
    let config;
    try {
        const rawConfig = readFileSync(configFilePath, 'utf8');
        config = JSON.parse(rawConfig);
    } catch (e) {
        throw new Error(`Deployment key not found. Please obtain a new deployment key at https://app.subsquid.io`);
    }
    return config.credentials;
}

export function deleteCreds(): void {
    try {
        setCreds('empty');
    } catch (e) {
        throw new Error(`Deployment key not found. Please obtain a new deployment key at https://app.subsquid.io`);
    }
}

export async function getMe(): Promise<{ login: string }> {
    const result = await fetch('https://api.github.com/user', {
        headers: {
            authorization: `token ${getCreds()}`,
        },
    });
    return result.json();
}
