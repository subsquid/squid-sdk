import { baseUrl } from '../baseUrl';
import { getCreds } from '../../creds';
import { request } from '../request';

/** Release (create) version */
export async function release(
    squidName: string,
    versionName: string,
    artifactUrl: string,
    description?: string
): Promise<{
    id: number;
    name: string;
    version: { deploymentUrl: string };
} | void> {
    const apiUrl = `${baseUrl}/client/squid/${squidName}/version`;
    const response = await request(apiUrl, {
        method: 'post',
        body: JSON.stringify({ artifactUrl, versionName, description }),
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
