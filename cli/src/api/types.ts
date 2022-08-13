export type HttpResponse<T> = {
  payload: T
}

export enum DeployStatus {
  IMAGE_BUILDING = 'IMAGE_BUILDING',
  DEPLOYING = 'DEPLOYING',
  INITIALIZING = 'INITIALIZING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

export type DeployResponse = {
  id: string
  status: DeployStatus
  failed: boolean
  logs: string[]
}

export type DeploymentStatus = 'CREATED' | 'DEPLOYING' | 'DEPLOY_ERROR' | 'DEPLOYED';
export type SecretsStatus = 'UP_TO_DATE' | 'NONE' | 'OUTDATED';

export type VersionResponse = {
  name: string;
  artifactUrl: string;
  deploymentUrl: string;
  description: string;
  status: DeploymentStatus;
  secretStatus: SecretsStatus;
  api: {
    status: string
  };
  processor: {
    status: string
    syncState: {
      currentBlock: number
      totalBlocks: number
    }
  };
  alias: string;
  createdAt: number;
};

export type SquidResponse = {
  id: number;
  name: string;
  description: string;
  logoUrl: string;
  sourceCodeUrl: string;
  websiteUrl: string;
  versions: VersionResponse[];
  aliasProd: string
  isPublic: boolean
  deploy?: DeployResponse
  createdAt: Date
};

export type SecretsListResponse = {
  secrets: Record<string, string>;
}

export type ManifestResponse = {
  squid: SquidResponse
}

export enum LogLevel {
  Error = 'ERROR',
  Debug = 'DEBUG',
  Info = 'INFO',
  Notice = 'NOTICE',
  Warning = 'WARNING',
  Critical = 'CRITICAL',
  Fatal = 'FATAL',
}
export type LogPayload = string | Record<string, unknown>

export type LogEntry = {
  timestamp: string
  container: string
  level: LogLevel
  payload: LogPayload
}

export type LogsResponse = {
  logs: LogEntry[];
  nextPage: string | null;
};

export type SquidVersionResponse = {
  id: number
  name: string
  version: { 
    deploymentUrl: string 
  }
}
