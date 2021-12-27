import { baseUrl } from '../baseUrl';
import { getCreds } from '../../creds';
import { request } from '../request';

/** Update version image */
export async function update(
    squidName: string,
    versionName: string,
    artifactUrl: string
): Promise<{
    id: number;
    name: string;
    version: { deploymentUrl: string };
} | void> {
    const apiUrl = `${baseUrl}/client/squid/${squidName}/version/${versionName}/deployment`;
    const response = await request(apiUrl, {
        method: 'put',
        body: JSON.stringify({ artifactUrl }),
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'application/json',
            authorization: `token ${getCreds()}`,
        },
    });
    const responseBody = await response.json();
    if (response.status === 200) {
        return responseBody;
    }
}
