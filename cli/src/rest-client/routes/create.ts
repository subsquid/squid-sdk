import { baseUrl } from '../baseUrl';
import { getCreds } from '../../creds';
import { request } from '../request';

export async function create(
    name: string,
    description?: string,
    logoUrl?: string,
    websiteUrl?: string
): Promise<string | undefined> {
    const apiUrl = `${baseUrl}/client/squid`;
    const response = await request(apiUrl, {
        method: 'post',
        body: JSON.stringify({
            name,
            description,
            logoUrl,
            websiteUrl,
        }),
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'application/json',
            authorization: `token ${getCreds()}`,
        },
    });
    const responseBody = await response.json();
    if (response.status === 200) {
        return `Created squid with name ${responseBody.name}`;
    }
}
