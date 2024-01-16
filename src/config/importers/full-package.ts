import { RemoteDownloader } from '../../downloaders/remote.js';
import { createIconSetsPackageImporter } from '../../importers/full/json.js';
import type { RemoteDownloaderOptions } from '../../types/downloaders/remote.js';
import type { ImportedData } from '../../types/importers/common.js';

/**
 * Importer for all icon sets from `@iconify/json` package
 */

// Source options, select one you prefer

// Import from NPM. Does not require any additonal configuration
const npm: RemoteDownloaderOptions = {
	downloadType: 'npm',
	package: '@iconify/json',
};

// Import from GitHub. Requires setting GitHub API token in environment variable `GITHUB_TOKEN`
const github: RemoteDownloaderOptions = {
	downloadType: 'github',
	user: 'iconify',
	repo: 'icon-sets',
	branch: 'master',
	token: process.env['GITHUB_TOKEN'] || '',
};

// Import from GitHub using git client. Does not require any additonal configuration
const git: RemoteDownloaderOptions = {
	downloadType: 'git',
	remote: 'https://github.com/iconify/icon-sets.git',
	branch: 'master',
};

export const fullPackageImporter = createIconSetsPackageImporter(
	new RemoteDownloader<ImportedData>(
		npm,
		// Automatically update on startup: boolean
		true
	),
	{
		// Filter icon sets. Returns true if icon set should be included, false if not
		filter: (prefix, info) => {
			return true;
		},
	}
);
