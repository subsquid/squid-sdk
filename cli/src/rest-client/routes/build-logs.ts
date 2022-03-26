import { request } from '../request';

export async function buildLogs(
  squidName: string,
  versionName: string,
): Promise<void> {
  const response = await request(`/${squidName}/image-building-logs`, {
    query: {
      name: versionName,
    }
  });
  response.body.on('data', (data: Buffer) => {
    const dataString = data.toString();
    if (dataString.length > 0) {
      process.stdout.write(dataString);
    }
  });
}
