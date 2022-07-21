import { CreateSecretResponse, SecretsListResponse } from './types';
import { api } from './api';

export async function createSecret(name: string, value: string): Promise<CreateSecretResponse> {
    const { body } = await api<CreateSecretResponse>( {
        method: 'post',
        path: '/client/secret/create',
        data: { name, value }
    });
    return body || { result: "error" }
}

export async function listSecrets(): Promise<SecretsListResponse> {
    const { body } = await api<SecretsListResponse>( {
        method: 'get',
        path: '/client/secret/list'
    });
    return body || { secrets: {} }
}