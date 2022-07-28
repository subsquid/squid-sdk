import { HttpResponse, SecretsListResponse } from './types';
import { api } from './api';

export async function listSecrets(): Promise<SecretsListResponse> {
    const { body } = await api<HttpResponse<SecretsListResponse>>( {
        method: 'get',
        path: '/secrets'
    });
    return body.payload
}

export async function removeSecret(name: string): Promise<SecretsListResponse> {
    const { body } = await api<HttpResponse<SecretsListResponse>>( {
        method: 'delete',
        path: `/secrets/${name}`,
    });
    return body.payload
}

export async function setSecret(secrets: Record<string, string>): Promise<SecretsListResponse> {
    const { body } = await api<HttpResponse<SecretsListResponse>>( {
        method: 'patch',
        path: `/secrets`,
        data: { secrets: secrets }
    });
    return body.payload
}
