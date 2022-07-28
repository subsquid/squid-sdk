import { SetSecretResponse, HttpResponse, SecretsListResponse } from './types';
import { api } from './api';

export async function listSecrets(): Promise<SecretsListResponse> {
    const { body } = await api<HttpResponse<SecretsListResponse>>( {
        method: 'get',
        path: '/client/secrets/list'
    });
    return body.payload
}

export async function removeSecret(name: string): Promise<SetSecretResponse> {
    const { body } = await api<HttpResponse<SetSecretResponse>>( {
        method: 'delete',
        path: `/client/secrets/${name}`,
    });
    return body.payload
}

export async function setSecret(name: string, value: string): Promise<SetSecretResponse> {
    const { body } = await api<HttpResponse<SetSecretResponse>>( {
        method: 'put',
        path: `/client/secrets/${name}`,
        data: { value }
    });
    return body.payload
}
