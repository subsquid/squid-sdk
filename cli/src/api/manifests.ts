import { HttpResponse, ManifestResponse } from './types';
import { api } from './api';

export async function getSquidByManifest({ artifactUrl }: { artifactUrl: string }): Promise<ManifestResponse> {
  const { body } = await api<HttpResponse<ManifestResponse>>( {
    method: 'get',
    path: `/client/manifests/`,
    query: {
      artifactUrl,
    }
  });

  return body.payload;
}

