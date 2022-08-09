import { api } from '../../api';

type SquidListResponse = {
    id: number;
    name: string;
    description: string;
    logoUrl: string;
    sourceCodeUrl: string;
    websiteUrl: string;
};

export async function squidList(): Promise<SquidListResponse[]> {
    const { body } =  await api<SquidListResponse[]>({
        method: 'get',
        path: '/client/squid',
    });

    return body
}
