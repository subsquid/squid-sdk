import { ChangeSecretResponse, SecretsListResponse } from './types';
import { api } from './api';

export async function listSecrets(): Promise<SecretsListResponse> {
    const { body } = await api<SecretsListResponse>( {
        method: 'get',
        path: '/client/secret/list'
    });
    return body || { secrets: {} }
}

export async function removeSecret(name: string): Promise<ChangeSecretResponse> {
    const { body } = await api<ChangeSecretResponse>( {
        method: 'delete',
        path: `/client/secret/${name}`,
    });
    return body
}

export async function setSecret(name: string, value: string): Promise<ChangeSecretResponse> {
    const { body } = await api<ChangeSecretResponse>( {
        method: 'put',
        path: `/client/secret/${name}`,
        data: { value }
    });
    return body
}
