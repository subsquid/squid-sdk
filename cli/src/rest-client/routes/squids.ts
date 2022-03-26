import { baseUrl } from '../baseUrl';
import { request } from '../request';

interface SquidListResponse {
    id: number;
    name: string;
    description: string;
    logoUrl: string;
    sourceCodeUrl: string;
    websiteUrl: string;
}

export async function squidList(): Promise<SquidListResponse[] | undefined> {
  const { status, body } = await request<SquidListResponse[]>(`${baseUrl}/client/squid`);
  if (status === 200) {
    return body;
  }
}
