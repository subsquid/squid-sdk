import {
    readFileSync,
    writeFileSync,
    existsSync,
    mkdirSync,
    unlinkSync,
} from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';
import fetch from 'node-fetch';

export const credentialsDirectory = resolve(homedir(), '.hydra-cli');
export const credentialsFilePath = resolve(credentialsDirectory, 'credentials');

export function setCreds(creds: string): void {
    if (!existsSync(credentialsDirectory)) {
        mkdirSync(credentialsDirectory);
    }
    writeFileSync(credentialsFilePath, creds, {
        flag: 'w',
        encoding: 'utf8',
    });
}

export function getCreds(): string {
    let creds;
    try {
        creds = readFileSync(credentialsFilePath, 'utf8');
    } catch (e) {
        throw new Error(`Credentials data not found. Run hydra-cli login`);
    }
    return creds;
}

export function deleteCreds(): void {
    try {
        unlinkSync(credentialsFilePath);
    } catch (e) {
        throw new Error(`Credentials data not found. Run hydra-cli login`);
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
