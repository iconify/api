import { downloadGitRepo } from '@iconify/tools/lib/download/git';
import { downloadGitHubRepo } from '@iconify/tools/lib/download/github';
import { downloadGitLabRepo } from '@iconify/tools/lib/download/gitlab';
import { downloadNPMPackage } from '@iconify/tools/lib/download/npm';
import { appConfig } from '../../config/app.js';
import type { RemoteDownloaderOptions, RemoteDownloaderVersion } from '../../types/downloaders/remote.js';
import {
	isGitHubUpdateAvailable,
	isGitLabUpdateAvailable,
	isGitUpdateAvailable,
	isNPMUpdateAvailable,
} from './check-update.js';
import { getDownloadDirectory } from './target.js';

/**
 * Download files from remote archive
 */
export async function downloadRemoteArchive(
	options: RemoteDownloaderOptions,
	ifModifiedSince?: RemoteDownloaderVersion | null,
	key?: string
): Promise<false | RemoteDownloaderVersion> {
	const target = getDownloadDirectory(options, key);

	switch (options.downloadType) {
		case 'git': {
			if (ifModifiedSince?.downloadType === 'git' && !(await isGitUpdateAvailable(options, ifModifiedSince))) {
				return false;
			}

			// Download
			return await downloadGitRepo({
				target,
				log: appConfig.log,
				...options,
			});
		}

		case 'github': {
			if (
				ifModifiedSince?.downloadType === 'github' &&
				!(await isGitHubUpdateAvailable(options, ifModifiedSince))
			) {
				return false;
			}

			// Download
			return await downloadGitHubRepo({
				target,
				log: appConfig.log,
				...options,
			});
		}

		case 'gitlab': {
			if (
				ifModifiedSince?.downloadType === 'gitlab' &&
				!(await isGitLabUpdateAvailable(options, ifModifiedSince))
			) {
				return false;
			}

			// Download
			return await downloadGitLabRepo({
				target,
				log: appConfig.log,
				...options,
			});
		}

		case 'npm': {
			if (ifModifiedSince?.downloadType === 'npm' && !(await isNPMUpdateAvailable(options, ifModifiedSince))) {
				return false;
			}

			// Download
			return await downloadNPMPackage({
				target,
				log: appConfig.log,
				...options,
			});
		}
	}
}
