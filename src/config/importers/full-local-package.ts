import { dirname } from 'node:path';
import { resolveSync } from 'mlly';
import { Importer } from '../../types/importers.js';
import { createIconSetsPackageImporter } from '../../importers/full/json.js';
import { ImportedData } from '../../types/importers/common.js';
import { DirectoryDownloader } from '../../downloaders/directory.js';
import type { RemoteDownloaderOptions } from '../../types/downloaders/remote.js';
import { RemoteDownloader } from '../../downloaders/remote.js';

/**
 * Create importer for package
 */
export function createPackageIconSetImporter(
	packageName = '@iconify/json',
	useRemoteFallback = false,
	autoUpdateRemotePackage = false
): Importer {
	// Try to locate package
	let dir: string | undefined;
	try {
		const filename = resolveSync(`${packageName}/package.json`, {
			url: import.meta.url,
		});
		dir = filename ? dirname(filename) : undefined;
	} catch (err) {
		//
	}
	if (dir) {
		return createIconSetsPackageImporter(new DirectoryDownloader<ImportedData>(dir), {});
	}
	if (!useRemoteFallback) {
		throw new Error(`Cannot find package "${packageName}"`);
	}

	// Try to download it, update if
	const npm: RemoteDownloaderOptions = {
		downloadType: 'npm',
		package: packageName,
	};
	return createIconSetsPackageImporter(new RemoteDownloader<ImportedData>(npm, autoUpdateRemotePackage));
}
