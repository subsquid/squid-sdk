import { baseUrl } from '../baseUrl';
import { request } from '../request';

export async function me(authToken: string): Promise<string | undefined> {
    const apiUrl = `${baseUrl}/client/me`;
    const response = await request(apiUrl, {
        headers: {
            authorization: `token ${authToken}`,
        },
    });
    const responseBody = await response.json();
    if (response.status === 200) {
        return `Successfully logged as ${responseBody.username}`;
    }
}
