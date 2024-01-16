import { hashString } from '../../misc/hash.js';
import type { RemoteDownloaderOptions } from '../../types/downloaders/remote.js';

/**
 * Get cache key
 */
export function getRemoteDownloaderCacheKey(options: RemoteDownloaderOptions): string {
	switch (options.downloadType) {
		case 'git':
			return hashString(`${options.remote}#${options.branch}`);

		case 'github':
			return `${options.user}-${options.repo}-${options.branch}`;

		case 'gitlab':
			return `${options.uri ? hashString(options.uri + options.project) : options.project}-${options.branch}`;

		case 'npm':
			return options.package + (options.tag ? '-' + options.tag : '');
	}
}
