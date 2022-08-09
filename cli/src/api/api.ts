import fetch from 'node-fetch';
import path from 'path';
import chalk from 'chalk';
import qs from 'query-string';
import { getConfig } from '../config';

const debug = process.env.API_DEBUG === 'true';

let version = 'unknown'
try {
  version = require(path.resolve(__dirname, '../../package.json')).version
} catch (e) {}

export class ApiError extends Error {
  constructor(public status: number, public body: {
    error: string
    invalidFields?: { path: string[], message: string, type: string }[]
  }) {
    super();
  }
}

export async function api<T = any>(
  { method, path, data, query, responseType = 'json' } : {
    method: 'get' |'post' | 'put' | 'delete' | 'patch'
    path: string,
    query?: Record<string, string | string[] | boolean | number | undefined>,
    data?: unknown
    responseType?: 'json' | 'stream'
  }
): Promise<{ body: T } > {
  const config = getConfig();

  const url = `${config.apiUrl}${path}${query ? `?${qs.stringify(query)}` : ''}`

  const headers = {
    'Content-Type': 'application/json',
    authorization: `token ${config.credentials}`,
    'X-CLI-Version': version,
  }

  if (debug) {
    console.log(
      chalk.cyan`[HTTP REQUEST]`,
      chalk.dim(method?.toUpperCase()),
      url,
      chalk.dim(JSON.stringify({headers}))
    );
    if (data) {
      console.log(chalk.dim(JSON.stringify(data)));
    }
  }
  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  let body
  try {
    body = responseType === 'json'? await response.json() : response.body;
  } catch (e) {}

  if (debug) {
    console.log(
      chalk.cyan`[HTTP RESPONSE]`,
      url,
      chalk.cyan(response.status),
      chalk.dim(JSON.stringify({ headers: response.headers }))
    );
    if (body && responseType === 'json') {
      console.log(chalk.dim(JSON.stringify(body, null, 2)));
    }
  }

  switch (response.status) {
    case 200:
    case 201:
      return { body };
    default:
      throw new ApiError(response.status, body as any);
  }
}
