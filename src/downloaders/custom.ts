import { BaseDownloader } from './base.js';

/**
 * Custom downloader
 *
 * Class extending this downloader must implement:
 * - constructor()
 * - _init()
 * - _checkForUpdate()
 * - _loadData()
 */
export class CustomDownloader<DataType> extends BaseDownloader<DataType> {
	/**
	 * Load content
	 */
	async _loadContent() {
		if (!this._loadData) {
			throw new Error('Importer does not implement _loadData()');
		}

		const result = await this._loadData();
		if (result) {
			this.data = result;
			await this._dataUpdated?.(result);
		}
	}
}
