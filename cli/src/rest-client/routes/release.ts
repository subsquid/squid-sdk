import { baseUrl } from '../baseUrl';
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
  const { status, body } = await request(apiUrl, {
    method: 'post',
    body: { artifactUrl, versionName, description },
  });
  if (status === 200) {
    return body;
  }
}
