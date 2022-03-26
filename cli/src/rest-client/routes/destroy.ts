import { baseUrl } from '../baseUrl';
import { getCreds } from '../../creds';
import { request } from '../request';

export async function destroyDeployment(
  squidName: string,
  version: string
): Promise<string | undefined> {
  const apiUrl = `${baseUrl}/client/squid/${squidName}/version?name=${version}`;
  const { status, body } = await request(apiUrl, {
    method: 'delete',

  });
  if (status === 200) {
    return `Destroyed Squid version ${body.squidName}`;
  }
}

export async function destroyApp(name: string): Promise<string | undefined> {
  const apiUrl = `${baseUrl}/client/squid/${name}`;
  const { status, body } = await request(apiUrl, {
    method: 'delete',
  });
  if (status === 200) {
    return `Destroyed Squid ${body.name}`;
  }
}
