import { appConfig } from '../../config/app';
import type { RemoteDownloaderOptions } from '../../types/downloaders/remote';
import { getRemoteDownloaderCacheKey } from './key';

/**
 * Get directory
 */
export function getDownloadDirectory(options: RemoteDownloaderOptions, key?: string): string {
	key = key || getRemoteDownloaderCacheKey(options);

	switch (options.downloadType) {
		case 'git':
			return appConfig.cacheRootDir + '/git/' + key;

		case 'github':
			return appConfig.cacheRootDir + '/github/' + key;

		case 'gitlab':
			return appConfig.cacheRootDir + '/github/' + key;

		case 'npm':
			return appConfig.cacheRootDir + '/npm/' + key;
	}
}
