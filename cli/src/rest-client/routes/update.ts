import { baseUrl } from '../baseUrl';
import { request } from '../request';

/** Update version image */
export async function update(
  squidName: string,
  versionName: string,
  artifactUrl: string,
  hardReset: boolean
): Promise<{
    id: number;
    name: string;
    deploymentUrl: string
} | void> {
  const apiUrl = `${baseUrl}/client/squid/${squidName}/version/${versionName}/deployment`;
  const { status, body } = await request(apiUrl, {
    method: 'put',
    body: { artifactUrl, hardReset },
  });
  if (status === 200) {
    return body;
  }
}
