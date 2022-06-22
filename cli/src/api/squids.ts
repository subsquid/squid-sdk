import { HttpResponse, LogsResponse, SquidResponse } from './types';
import { api, ApiError } from './api';
import { Stream } from 'stream';

export async function getSquids() {
  const { body } = await api<SquidResponse[]>( {
    method: 'get',
    path: `/client/squids`,
    query: {
      withVersions: true
    }
  });

  return body || [];
}

export async function getSquid(name: string) {
  const { body } = await api<SquidResponse>( {
    method: 'get',
    path: `/client/squids/${name}`,
    query: {
      withVersions: true
    }
  });

  return body;
}

export async function deleteSquid(squidName: string) {
  const { body } = await api<HttpResponse<SquidResponse>>( {
    method: 'delete',
    path: `/client/squids/${squidName}`,
  });

  return body.payload
}

export async function deleteSquidVersion(squidName: string, versionName: string) {
  const { body } = await api<HttpResponse<SquidResponse>>( {
    method: 'delete',
    path: `/client/squids/${squidName}/versions/${versionName}`,
  });

  return body.payload
}

export async function versionHistoryLogs(squidName: string, versionName: string, { limit,  from, nextPage, orderBy } : {
  limit: number
  from: Date
  nextPage?: string
  orderBy?: string,
}): Promise<LogsResponse> {
  const { body } = await api<HttpResponse<LogsResponse>>( {
    method: 'get',
    path: `/client/squids/${squidName}/versions/${versionName}/logs/history`,
    query: {
      limit,
      from: from.toISOString(),
      nextPage,
      orderBy,
    }
  });

  return body.payload || { logs: [], nextPage: null }
}


export async function versionTailLogs(squidName: string, versionName: string) {
  const { body } = await api<NodeJS.ReadableStream>( {
    method: 'get',
    path: `/client/squids/${squidName}/versions/${versionName}/logs/tail`,
    responseType: 'stream'
  });

  if(!body) {
    throw new ApiError(404, { error: 'stream is missing in body response' })
  }

  return body
}


