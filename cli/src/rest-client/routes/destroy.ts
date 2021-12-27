import { baseUrl } from '../baseUrl';
import { getCreds } from '../../creds';
import { request } from '../request';

export async function destroyDeployment(
    squidName: string,
    version: string
): Promise<string | undefined> {
    const apiUrl = `${baseUrl}/client/squid/${squidName}/version?name=${version}`;
    const response = await request(apiUrl, {
        method: 'delete',
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'application/json',
            authorization: `token ${getCreds()}`,
        },
    });
    const responseBody = await response.json();
    if (response.status === 200) {
        return `Destroyed version with name ${responseBody.squidName}`;
    }
}

export async function destroyApp(name: string): Promise<string | undefined> {
    const apiUrl = `${baseUrl}/client/squid/${name}`;
    const response = await request(apiUrl, {
        method: 'delete',
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'application/json',
            authorization: `token ${getCreds()}`,
        },
    });
    const responseBody = await response.json();
    if (response.status === 200) {
        return `Destroyed squid with name ${responseBody.name}`;
    }
}
