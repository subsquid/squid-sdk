import * as fetch from 'node-fetch';

export async function request(
    apiUrl: string,
    fetchContext: fetch.RequestInit | undefined
): Promise<fetch.Response> {
    const response = await fetch.default(apiUrl, fetchContext);
    const responseBody = await response.clone().json();
    if (response.status === 401) {
        throw new Error(
            `Authentication failure. Please obtain a new deployment key at https://app.subsquid.io and follow the instructions`
        );
    } else if (response.status === 400 && responseBody.errors.length === 0) {
        throw new Error(responseBody.message);
    } else if (response.status === 400 && responseBody.errors.length !== 0) {
        let validationErrorString = 'An error occured processing the request:\n';
        for (const error of responseBody.errors) {
            for (const constraint of Object.values(error.constraints)) {
                validationErrorString += `${constraint}\n`;
            }
        }
        throw new Error(validationErrorString);
    } else if (response.status === 200) {
        return response;
    } else {
        throw new Error(`Squid server error. Please come back later. If the error persists please open an issue at https://github.com/subsquid/squid and report to t.me/HydraDevs`);
    }
}
