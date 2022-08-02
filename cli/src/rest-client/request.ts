import * as fetch from 'node-fetch';
import chalk from 'chalk';

const debug = process.env.API_DEBUG === 'true';

export async function request(
    apiUrl: string,
    fetchContext: fetch.RequestInit | undefined
): Promise<fetch.Response> {
    const { headers, body, method } = fetchContext || {}
    if (debug) {
        console.log(
          chalk.cyan`[HTTP REQUEST]`,
          chalk.dim(method?.toUpperCase()),
          apiUrl,
          chalk.dim(JSON.stringify({ headers }))
        );
        if (body) {
            console.log(chalk.dim(body));
        }
    }
    const response = await fetch.default(apiUrl, fetchContext);
    const responseBody = await response.clone().json();
    if (debug) {
        console.log(
          chalk.cyan`[HTTP RESPONSE]`,
          apiUrl,
          chalk.cyan(response.status),
          chalk.dim(JSON.stringify({ headers: response.headers }))
        );
        if (responseBody) {
            console.log(chalk.dim(JSON.stringify(responseBody, null ,2)));
        }
    }

    if (response.status === 200) {
        return response;
    } else if (response.status === 401) {
        throw new Error(
            `Authentication failure. Please obtain a new deployment key at https://app.subsquid.io and follow the instructions`
        );
    }
    else if (response.status === 400 && responseBody.errors?.length !== 0) {
        let validationErrorString = 'An error occurred processing the request:\n';
        for (const error of responseBody.errors) {
            for (const constraint of Object.values(error.constraints)) {
                validationErrorString += `${constraint}\n`;
            }
        }
        throw new Error(validationErrorString);
    } else {
        if (response.status < 500) {
            throw new Error(responseBody.label || responseBody.message);
        }

        throw new Error(`Squid server error. Please come back later. If the error persists please open an issue at https://github.com/subsquid/squid and report to t.me/HydraDevs`);
    }
}
