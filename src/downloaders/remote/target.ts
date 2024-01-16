import { appConfig } from '../../config/app.js';
import type { RemoteDownloaderOptions } from '../../types/downloaders/remote.js';
import { getRemoteDownloaderCacheKey } from './key.js';

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
