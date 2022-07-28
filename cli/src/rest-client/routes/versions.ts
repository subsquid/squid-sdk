import { baseUrl } from '../baseUrl';
import { getCreds } from '../../creds';
import { request } from '../request';

type DeploymentStatus = 'CREATED' | 'BUILDING' | 'ERROR' | 'OK';
type SecretsStatus = 'UP_TO_DATE' | 'NONE' | 'OUTDATED';

export type DeploymentListResponse = {
    name: string;
    artifactUrl: string;
    deploymentUrl: string;
    secretsStatus: SecretsStatus;
    status: DeploymentStatus;
    createdAt: number;
};

export async function versionList(
    squidName: string
): Promise<DeploymentListResponse[] | undefined> {
    const apiUrl = `${baseUrl}/client/squid/${squidName}/versions`;
    const response = await request(apiUrl, {
        method: 'get',
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'application/json',
            authorization: `token ${getCreds()}`,
        },
    });
    const responseBody: DeploymentListResponse[] = await response.json();
    if (response.status === 200) {
        return responseBody;
    }
}
