import { directoryExists } from '../misc/files.js';
import type { RemoteDownloaderOptions, RemoteDownloaderVersion } from '../types/downloaders/remote.js';
import { BaseDownloader } from './base.js';
import { downloadRemoteArchive } from './remote/download.js';
import { getRemoteDownloaderCacheKey } from './remote/key.js';
import { getDownloaderVersion, saveDownloaderVersion } from './remote/versions.js';

/**
 * Remote downloader
 *
 * Class extending this downloader must implement:
 * - _loadDataFromDirectory()
 */
export class RemoteDownloader<DataType> extends BaseDownloader<DataType> {
	// Params
	_downloader: RemoteDownloaderOptions;
	_autoUpdate: boolean;

	// Source directory
	_sourceDir?: string;

	// Latest version
	_version?: RemoteDownloaderVersion;

	/**
	 * Constructor
	 */
	constructor(downloader: RemoteDownloaderOptions, autoUpdate?: boolean) {
		super();
		this._downloader = downloader;
		this._autoUpdate = !!autoUpdate;
	}

	/**
	 * Init downloader
	 */
	async _init() {
		const downloader = this._downloader;
		const cacheKey = getRemoteDownloaderCacheKey(downloader);

		// Get last stored version
		const lastVersion = await getDownloaderVersion(cacheKey, downloader.downloadType);

		if (lastVersion && !this._autoUpdate) {
			// Keep last version
			const directory = lastVersion.contentsDir;
			if (await directoryExists(directory)) {
				// Keep old version
				this._sourceDir = directory;
				this._version = lastVersion;
				return true;
			}
		}

		// Missing or need to check for update
		const version = await downloadRemoteArchive(
			downloader,
			lastVersion?.downloadType === downloader.downloadType ? lastVersion : void 0
		);
		if (version === false) {
			if (lastVersion) {
				// Keep last version
				const directory = lastVersion.contentsDir;
				if (await directoryExists(directory)) {
					// Keep old version
					this._sourceDir = directory;
					this._version = lastVersion;
					return true;
				}
			}

			// Failed
			return false;
		}

		// Use `version`
		const directory = version.contentsDir;
		if (await directoryExists(directory)) {
			await saveDownloaderVersion(cacheKey, version);
			this._sourceDir = directory;
			this._version = version;
			return true;
		}

		// Failed
		return false;
	}

	/**
	 * Check for update
	 */
	_checkForUpdate(done: (value: boolean) => void): void {
		const downloader = this._downloader;

		// Promise version of _checkForUpdate()
		const check = async () => {
			const lastVersion = this._version;

			// Check for update
			const version = await downloadRemoteArchive(
				downloader,
				lastVersion?.downloadType === downloader.downloadType ? lastVersion : void 0
			);
			if (version === false) {
				// Nothing to update
				return false;
			}

			// Save new version, use it
			await saveDownloaderVersion(getRemoteDownloaderCacheKey(downloader), version);
			this._sourceDir = version.contentsDir;
			this._version = version;
			return true;
		};

		check()
			.then(done)
			.catch((err) => {
				console.error(err);
				done(false);
			});
	}

	/**
	 * Load content
	 */
	async _loadContent() {
		if (!this._loadDataFromDirectory) {
			throw new Error('Importer does not implement _loadDataFromDirectory()');
		}

		const source = this._sourceDir;
		const result = source && (await this._loadDataFromDirectory(source));
		if (result) {
			this.data = result;
			await this._dataUpdated?.(result);
		}
	}
}
