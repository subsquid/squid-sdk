import { baseUrl } from '../baseUrl';
import { request } from '../request';

export async function create(
  name: string,
  description?: string,
  logoUrl?: string,
  websiteUrl?: string
): Promise<string | undefined> {
  const { status, body } = await request(`${baseUrl}/client/squid`, {
    method: 'post',
    body: {
      name,
      description,
      logoUrl,
      websiteUrl,
    },
  });
  if (status === 200) {
    return `Created squid with name ${body.name}`;
  }
}
