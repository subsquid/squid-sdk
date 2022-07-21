import { ChangeSecretResponse, SecretsListResponse } from './types';
import { api } from './api';

export async function createSecret(name: string, value: string): Promise<ChangeSecretResponse> {
    const { body } = await api<ChangeSecretResponse>( {
        method: 'post',
        path: '/client/secret/create',
        data: { name, value }
    });
    return body
}

export async function listSecrets(): Promise<SecretsListResponse> {
    const { body } = await api<SecretsListResponse>( {
        method: 'get',
        path: '/client/secret/list'
    });
    return body || { secrets: {} }
}

export async function removeSecret(name: string): Promise<ChangeSecretResponse> {
    const { body } = await api<ChangeSecretResponse>( {
        method: 'post',
        path: '/client/secret/remove',
        data: { name }
    });
    return body
}

export async function updateSecret(name: string, value: string): Promise<ChangeSecretResponse> {
    const { body } = await api<ChangeSecretResponse>( {
        method: 'post',
        path: '/client/secret/update',
        data: { name, value }
    });
    return body
}
