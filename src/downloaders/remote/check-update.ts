import { execAsync } from '@iconify/tools/lib/misc/exec';
import { getGitHubRepoHash } from '@iconify/tools/lib/download/github/hash';
import { getGitLabRepoHash } from '@iconify/tools/lib/download/gitlab/hash';
import { getNPMVersion, getPackageVersion } from '@iconify/tools/lib/download/npm/version';
import { directoryExists } from '../../misc/files.js';
import type {
	GitDownloaderOptions,
	GitDownloaderVersion,
	GitHubDownloaderOptions,
	GitHubDownloaderVersion,
	GitLabDownloaderOptions,
	GitLabDownloaderVersion,
	NPMDownloaderOptions,
	NPMDownloaderVersion,
} from '../../types/downloaders/remote.js';

/**
 * Check git repo for update
 */
export async function isGitUpdateAvailable(
	options: GitDownloaderOptions,
	oldVersion: GitDownloaderVersion
): Promise<false | GitDownloaderVersion> {
	const result = await execAsync(`git ls-remote ${options.remote} --branch ${options.branch}`);
	const parts = result.stdout.split(/\s/);
	const hash = parts.shift() as string;
	if (hash !== oldVersion.hash || !(await directoryExists(oldVersion.contentsDir))) {
		const newVerison: GitDownloaderVersion = {
			...oldVersion,
			hash,
		};
		return newVerison;
	}
	return false;
}

/**
 * Check GitHub repo for update
 */
export async function isGitHubUpdateAvailable(
	options: GitHubDownloaderOptions,
	oldVersion: GitHubDownloaderVersion
): Promise<false | GitHubDownloaderVersion> {
	const hash = await getGitHubRepoHash(options);
	if (hash !== oldVersion.hash || !(await directoryExists(oldVersion.contentsDir))) {
		const newVerison: GitHubDownloaderVersion = {
			...oldVersion,
			hash,
		};
		return newVerison;
	}
	return false;
}

/**
 * Check GitLab repo for update
 */
export async function isGitLabUpdateAvailable(
	options: GitLabDownloaderOptions,
	oldVersion: GitLabDownloaderVersion
): Promise<false | GitLabDownloaderVersion> {
	const hash = await getGitLabRepoHash(options);
	if (hash !== oldVersion.hash || !(await directoryExists(oldVersion.contentsDir))) {
		const newVerison: GitLabDownloaderVersion = {
			...oldVersion,
			hash,
		};
		return newVerison;
	}
	return false;
}

/**
 * Check NPM package for update
 */
export async function isNPMUpdateAvailable(
	options: NPMDownloaderOptions,
	oldVersion: NPMDownloaderVersion
): Promise<false | NPMDownloaderVersion> {
	const { version } = await getNPMVersion(options);
	const dir = oldVersion.contentsDir;
	if (version !== oldVersion.version || !(await directoryExists(dir)) || (await getPackageVersion(dir)) !== version) {
		const newVerison: NPMDownloaderVersion = {
			...oldVersion,
			version,
		};
		return newVerison;
	}
	return false;
}
