import { baseUrl } from '../baseUrl';
import { request } from '../request';

export async function log(
  squidName: string,
  versionName: string,
  follow: boolean,
  lines: number
): Promise<void> {
  const apiUrl = `${baseUrl}/client/squid/${squidName}/logs`;
  const response = await request<NodeJS.ReadableStream>(apiUrl, {
    query:  {
      name: versionName,
      follow,
      lines,
    }
  });
  response.body.on('data', (data) => {
    const dataString = data.toString();
    if (dataString.length > 0) {
      process.stdout.write(dataString);
    }
  });
}
