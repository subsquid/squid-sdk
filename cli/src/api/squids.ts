import { HttpResponse, LogEntry, LogsResponse, SquidVersionResponse } from './types';
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