import { baseUrl } from '../baseUrl';
import { request } from '../request';

type DeploymentStatus = 'CREATED' | 'BUILDING' | 'ERROR' | 'OK';

export interface DeploymentListResponse {
    name: string;
    artifactUrl: string;
    deploymentUrl: string;
    status: DeploymentStatus;
    createdAt: number;
}

export async function versionList(
  squidName: string
): Promise<DeploymentListResponse[] | undefined> {
  const apiUrl = `${baseUrl}/client/squid/${squidName}/versions`;
  const { status, body } = await request<DeploymentListResponse[]>(apiUrl);
  if (status === 200) {
    return body;
  }
}
