import { baseUrl } from '../baseUrl';
import { getCreds } from '../../creds';
import { request } from '../request';

type SquidListResponse = {
    id: number;
    name: string;
    description: string;
    logoUrl: string;
    sourceCodeUrl: string;
    websiteUrl: string;
};

export async function squidList(): Promise<SquidListResponse[] | undefined> {
    const apiUrl = `${baseUrl}/client/squid`;
    const response = await request(apiUrl, {
        method: 'get',
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'application/json',
            authorization: `token ${getCreds()}`,
        },
    });
    const responseBody: SquidListResponse[] = await response.json();
    if (response.status === 200) {
        return responseBody;
    }
}
