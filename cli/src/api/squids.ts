import { HttpResponse, LogEntry, LogsResponse, SquidResponse, SquidVersionResponse, VersionResponse } from './types';
import { api } from './api';
import { createInterface } from 'readline';
import { pretty } from '../logs';

export async function versionHistoryLogs(squidName: string, versionName: string, query : {
  limit: number
  from: Date
  nextPage?: string
  orderBy?: string,
  container?: string[],
  level?: string[],
}): Promise<LogsResponse> {
  const { body } = await api<LogsResponse>( {
    method: 'get',
    path: `/client/squid/${squidName}/versions/${versionName}/logs/history`,
    query: {
      ...query,
      from: query.from.toISOString(),
      level: query.level?.map(l => l.toUpperCase()),
    }
  });

  return body || { logs: [], nextPage: null }
}

export async function versionLogsFollow(squidName: string, versionName: string, query: { container?: string[], level?: string[]}) {
  const { body } = await api<NodeJS.ReadableStream>({
    method: 'get',
    path: `/client/squid/${squidName}/versions/${versionName}/logs/follow`,
    query,
    responseType: 'stream',
  });

  return body
}

export function streamLines(body: NodeJS.ReadableStream, cb: (line: string) => void) {
  const rl = createInterface({
    input: body,
    crlfDelay: Infinity
  })

  rl.on('line', cb)

  return rl
}

export async function streamSquidLogs(squidName: string, versionName: string, onLog: (log: string) => unknown , query: { container?: string[], level?: string[]} = {}) {
  const stream = await versionLogsFollow(squidName, versionName, query);

  await new Promise((resolve, reject) => {
    streamLines(stream, (line) => {
      if (line.length === 0) return

      try {
        const entries: LogEntry[] = JSON.parse(line)

        pretty(entries).forEach(l => {
          onLog(l)
        });
      } catch (e) {
        reject(e)
      }
    })

    stream.on('error', reject)
  })
}

export async function releaseSquid(
    squidName: string, 
    versionName: string, 
    artifactUrl: string, 
    description?: string,
    envs?: Record<string, string>
  ): Promise<SquidVersionResponse> {
  const { body } = await api<HttpResponse<SquidVersionResponse>>( {
    method: 'post',
    path: `/client/squid/${squidName}/version`,
    data: { artifactUrl, versionName, description, envs }
  });
  return body.payload;
}

export async function updateSquid(
  squidName: string, 
  versionName: string, 
  artifactUrl: string, 
  hardReset: boolean,
  envs?: Record<string, string>
): Promise<VersionResponse> {
  const { body } = await api<HttpResponse<VersionResponse>>( {
    method: 'put',
    path: `/client/squid/${squidName}/version/${versionName}/deployment`,
    data: { artifactUrl, hardReset, envs }
  });
  return body.payload;
}

export async function redeploySquid(
  squidName: string, 
  versionName: string,
  envs?: Record<string, string>
): Promise<SquidResponse> {
  const { body } = await api<HttpResponse<SquidResponse>>( {
    method: 'put',
    path: `/client/squid/${squidName}/version/${versionName}/redeploy`,
    data: { envs }
  });
  return body.payload;
}