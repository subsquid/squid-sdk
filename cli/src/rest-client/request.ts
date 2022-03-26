import * as fetch from 'node-fetch';
import chalk from 'chalk';
import { getCreds } from '../creds';
import queryString from 'query-string';

const debug = process.env.API_DEBUG === 'true';

export async function request<T = any>(
  url: string,
  { method = 'get', headers = {}, body, query }: {
    method?: 'post'| 'get' | 'put' | 'delete',
    query?:  Record<string, unknown>,
    body?: Record<string, unknown> | string
    headers?: Record<string, string>
  } = {}
): Promise<{ status: number, body: T }> {
  if (!headers.authorization) {
    headers.authorization = `token ${getCreds()}`;
  }
  const fullUrl = `${url}${ query ? `?${queryString.stringify(query)}` : '' }`;
  if (debug) {
    console.log(chalk.cyan`[HTTP_REQUEST]`, fullUrl, chalk.dim(JSON.stringify({ headers })));
  }

  const response = await fetch.default(fullUrl, {
    method,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: typeof body !== 'string' ? JSON.stringify(body) : body,
  });
  if (!response.headers?.get('content-type')?.startsWith('application/json')) {
    return { status: response.status, body: response.body as unknown as T };
  }

  const responseBody = await response.json();
  if (debug) {
    console.log(
      chalk.cyan`[HTTP_RESPONSE]`,
      fullUrl,
      response.status < 400 ? chalk.green`${response.status}` : chalk.red`${response.status}`,
      chalk.dim(JSON.stringify(responseBody))
    );
  }
  if (response.status === 401) {
    throw new Error(
      `Authentication failure. Please obtain a new deployment key at https://app.subsquid.io and follow the instructions`
    );
  } else if (response.status === 400 && responseBody.errors.length === 0) {
    throw new Error(responseBody.message);
  } else if (response.status === 400 && responseBody.errors.length !== 0) {
    let validationErrorString = 'An error occurred processing the request:\n';
    for (const error of responseBody.errors) {
      for (const constraint of Object.values(error.constraints)) {
        validationErrorString += `${constraint}\n`;
      }
    }
    throw new Error(validationErrorString);
  } else if (response.status === 200) {
    return { status: response.status, body: responseBody };
  } else {
    throw new Error(`Squid server error. Please come back later. If the error persists, open an issue at https://github.com/subsquid/squid and report to t.me/HydraDevs`);
  }
}
