import { HttpResponse, LogsResponse } from './types';
import { api, ApiError } from './api';
import { createInterface } from 'readline';

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

export async function versionLogsFollow(squidName: string, versionName: string) {
  const {body, } = await api<NodeJS.ReadableStream>({
    method: 'get',
    path: `/client/squid/${squidName}/versions/${versionName}/logs/follow`,
    responseType: 'stream'
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
