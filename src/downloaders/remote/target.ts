import { downloadGitRepo } from '@iconify/tools/lib/download/git';
import { downloadGitHubRepo } from '@iconify/tools/lib/download/github';
import { downloadGitLabRepo } from '@iconify/tools/lib/download/gitlab';
import { downloadNPMPackage } from '@iconify/tools/lib/download/npm';
import { appConfig } from '../../config/app';
import type { RemoteDownloaderOptions, RemoteDownloaderVersion } from '../../types/downloaders/remote';
import {
	isGitHubUpdateAvailable,
	isGitLabUpdateAvailable,
	isGitUpdateAvailable,
	isNPMUpdateAvailable,
} from './check-update';
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
