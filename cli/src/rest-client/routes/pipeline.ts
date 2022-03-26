import { baseUrl } from '../baseUrl';
import { getCreds } from '../../creds';
import { request } from '../request';
import queryString from 'query-string';

export interface DeployPipelineResponse {
    squidName: string;
    version: string;
    status: DeployPipelineStatusEnum;
    isErrorOccurred: boolean;
    comment: string;
    clientId: number;
    updatedAt: number;
}

export enum DeployPipelineStatusEnum {
    CREATED = 'CREATED',
    IMAGE_BUILDING = 'IMAGE_BUILDING',
    IMAGE_PUSHING = 'IMAGE_PUSHING',
    DEPLOYING = 'DEPLOYING',
    OK = 'OK',
}

export async function getDeployPipeline(
  squidName: string,
  versionName: string
): Promise<DeployPipelineResponse | undefined> {
  const apiUrl = `${baseUrl}/client/squid/${squidName}/pipeline`;
  const { status, body } = await request(apiUrl, {
    query: { name: versionName },
  });
  if (status === 200) {
    return body;
  }
}
