import { getConfig } from '../config';

/**
 * @deprecated
 */
export function getCreds(): string {
    return getConfig().credentials
}
