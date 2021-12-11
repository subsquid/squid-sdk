import {IndexerStatusService} from "./IndexerStatusService"
import { IStatusService } from './IStatusService'

let statusService: IndexerStatusService | undefined

export async function getStatusService(): Promise<IStatusService> {
  if (statusService) {
    return statusService
  }
  statusService = new IndexerStatusService()
  await statusService.init()
  return statusService
}
