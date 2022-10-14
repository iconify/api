import type { GitHubAPIOptions } from '@iconify/tools/lib/download/github/types';
import type { GitLabAPIOptions } from '@iconify/tools/lib/download/gitlab/types';
import type { NPMPackageOptions } from '@iconify/tools/lib/download/npm/types';
import type { DownloadGitRepoResult } from '@iconify/tools/lib/download/git';
import type { DownloadGitHubRepoResult } from '@iconify/tools/lib/download/github';
import type { DownloadGitLabRepoResult } from '@iconify/tools/lib/download/gitlab';
import type { DownloadNPMPackageResult } from '@iconify/tools/lib/download/npm';

/**
 * Downloaders that download archive that contains files, which can be imported using various importers
 */
export type RemoteDownloaderType =
	// Any git repository
	| 'git'
	// Git repository using GitHub API
	| 'github'
	// Git repository using GitLab API
	| 'gitlab'
	// NPM package
	| 'npm';

/**
 * Options
 */
interface BaseRemoteDownloaderOptions {
	downloadType: RemoteDownloaderType;
}

export interface GitDownloaderOptions extends BaseRemoteDownloaderOptions {
	downloadType: 'git';

	// Repository
	remote: string;

	// Branch
	branch: string;
}

export interface GitHubDownloaderOptions extends BaseRemoteDownloaderOptions, GitHubAPIOptions {
	downloadType: 'github';
}

export interface GitLabDownloaderOptions extends BaseRemoteDownloaderOptions, GitLabAPIOptions {
	downloadType: 'gitlab';
}

export interface NPMDownloaderOptions extends BaseRemoteDownloaderOptions, NPMPackageOptions {
	downloadType: 'npm';
}

export type RemoteDownloaderOptions =
	| GitDownloaderOptions
	| GitHubDownloaderOptions
	| GitLabDownloaderOptions
	| NPMDownloaderOptions;

export type RemoteDownloaderOptionsMixin<T extends RemoteDownloaderType> = T extends 'git'
	? GitDownloaderOptions
	: T extends 'github'
	? GitHubDownloaderOptions
	: T extends 'gitlab'
	? GitLabDownloaderOptions
	: T extends 'npm'
	? NPMDownloaderOptions
	: never;

/**
 * Latest version result
 */
interface BaseRemoteDownloaderVersion {
	downloadType: RemoteDownloaderType;
}

export interface GitDownloaderVersion extends BaseRemoteDownloaderVersion, DownloadGitRepoResult {
	downloadType: 'git';

	// `contentsDir` contains full path to uncompressed files
	// `hash` contains latest version hash
}

export interface GitHubDownloaderVersion extends BaseRemoteDownloaderVersion, DownloadGitHubRepoResult {
	downloadType: 'github';

	// `contentsDir` contains full path to uncompressed files
	// `hash` contains latest version hash
}

export interface GitLabDownloaderVersion extends BaseRemoteDownloaderVersion, DownloadGitLabRepoResult {
	downloadType: 'gitlab';

	// `contentsDir` contains full path to uncompressed files
	// `hash` contains latest version hash
}

export interface NPMDownloaderVersion extends BaseRemoteDownloaderVersion, DownloadNPMPackageResult {
	downloadType: 'npm';

	// `contentsDir` contains full path to uncompressed files
	// `version` contains latest version
}

export type RemoteDownloaderVersion =
	| GitDownloaderVersion
	| GitHubDownloaderVersion
	| GitLabDownloaderVersion
	| NPMDownloaderVersion;

export type RemoteDownloaderVersionMixin<T extends RemoteDownloaderType> = T extends 'git'
	? GitDownloaderVersion
	: T extends 'github'
	? GitHubDownloaderVersion
	: T extends 'gitlab'
	? GitLabDownloaderVersion
	: T extends 'npm'
	? NPMDownloaderVersion
	: never;
