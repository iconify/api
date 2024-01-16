import { directoryExists, hashFiles, listFilesInDirectory } from '../misc/files.js';
import { BaseDownloader } from './base.js';

/**
 * Directory downloader
 *
 * Class extending this downloader must implement:
 * - _loadDataFromDirectory()
 */
export class DirectoryDownloader<DataType> extends BaseDownloader<DataType> {
	// Source directory
	path: string;

	// Last hash
	_lastHash: string = '';

	/**
	 * Constructor
	 */
	constructor(path: string) {
		super();
		this.path = path;
	}

	/**
	 * Hash content
	 */
	async _hashContent(): Promise<string> {
		const files = await listFilesInDirectory(this.path);
		return hashFiles(files);
	}

	/**
	 * Init downloader
	 */
	async _init() {
		if (!(await directoryExists(this.path))) {
			return false;
		}
		this._lastHash = await this._hashContent();
		return true;
	}

	/**
	 * Check if files were changed
	 */
	_checkForUpdate(done: (value: boolean) => void): void {
		this._hashContent()
			.then((hash) => {
				const changed = this._lastHash !== hash;
				this._lastHash = hash;
				done(changed);
			})
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

		const result = await this._loadDataFromDirectory(this.path);
		if (result) {
			this.data = result;
			await this._dataUpdated?.(result);
		}
	}
}
