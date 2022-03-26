import { baseUrl } from '../baseUrl';
import { request } from '../request';

export async function me(): Promise<string | undefined> {
  const { status, body } = await request(`${baseUrl}/client/me`);
  if (status === 200) {
    return `Successfully logged in as ${body.username}`;
  }
}
