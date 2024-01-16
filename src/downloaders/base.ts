import type { DownloaderStatus, DownloaderType } from '../types/downloaders/base.js';

/**
 * loadDataFromDirectory()
 */
type DataUpdated<DataType> = (data: DataType) => Promise<unknown>;

/**
 * loadDataFromDirectory()
 */
type LoadData<DataType> = () => Promise<DataType | void | undefined>;

/**
 * loadDataFromDirectory()
 */
type LoadDataFromDirectory<DataType> = (path: string) => Promise<DataType | void | undefined>;

/**
 * Base downloader class, shared with all child classes
 */
export abstract class BaseDownloader<DataType> {
	// Downloader type, set in child class
	type!: DownloaderType;

	// Downloader status
	status: DownloaderStatus = 'pending-init';

	// Data
	data?: DataType;

	// Waiting for reload
	// Can be reset in _checkForUpdate() function immediately during check for redundancy
	// to avoid running same check multiple times that might happen in edge cases
	_pendingReload = false;

	/**
	 * Load data from custom source, should be overwrtten by loader
	 *
	 * Used by loaders that do not implement _loadDataFromDirectory()
	 */
	_loadData?: LoadData<DataType>;

	/**
	 * Load data from directory, should be overwritten by loader
	 *
	 * Used by loaders that do not implement _loadData()
	 */
	_loadDataFromDirectory?: LoadDataFromDirectory<DataType>;

	/**
	 * Function to call when data has been updated
	 */
	_dataUpdated?: DataUpdated<DataType>;

	/**
	 * Load content. Called when content is ready to be loaded, should be overwritten by child classes
	 */
	async _loadContent() {
		throw new Error('_loadContent() not implemented');
	}

	/**
	 * Initialise downloader
	 *
	 * Returns true on success, false or reject on fatal error.
	 */
	async _init(): Promise<boolean> {
		throw new Error('_init() not implemented');
	}

	/**
	 * Initialise downloader
	 *
	 * Returns false on error
	 */
	async init(): Promise<boolean> {
		if (this.status === 'pending-init') {
			this.status = 'initialising';
			let result: boolean;
			try {
				result = await this._init();
			} catch (err) {
				// _init() failed
				console.error(err);

				this.status = false;
				return false;
			}

			if (result) {
				// Check for update if reload is pending
				if (this._pendingReload) {
					await this._checkForUpdateLoop();
				}

				// Load content
				await this._loadContent();
			}

			// Update status
			this.status = result;
			return result;
		}
		return false;
	}

	/**
	 * Check for update
	 *
	 * Function should update latest version value before calling done(true)
	 * All errors should be caught and callbac must finish. In case of error, return done(false)
	 */
	_checkForUpdate(done: (value: boolean) => void) {
		throw new Error('_checkForUpdate() not implemented');
	}

	/**
	 * Promise wrapper for _checkForUpdate()
	 */
	_checkForUpdateLoop(): Promise<boolean> {
		return new Promise((fulfill, reject) => {
			let updated = false;
			let changedStatus = false;

			// Change status
			if (this.status === true) {
				this.status = 'updating';
				changedStatus = true;
			}

			const check = (value: boolean) => {
				updated = updated || value;

				if (value) {
					// Successful update: reload data
					this._loadContent()
						.then(() => {
							check(false);
						})
						.catch((err) => {
							// Failed
							if (changedStatus) {
								this.status = true;
							}
							reject(err);
						});
					return;
				}

				if (this._pendingReload) {
					// Run reload
					this._pendingReload = false;
					this._checkForUpdate(check);
					return;
				}

				// Done
				if (changedStatus) {
					this.status = true;
				}
				fulfill(updated);
			};
			check(false);
		});
	}

	/**
	 * Check for update
	 */
	checkForUpdate(): Promise<boolean> {
		return new Promise((fulfill, reject) => {
			if (this.status === false) {
				fulfill(false);
				return;
			}

			if (this._pendingReload) {
				// Already pending: should be handled
				fulfill(false);
				return;
			}

			this._pendingReload = true;
			if (this.status === true) {
				// Check immediately
				this._checkForUpdateLoop().then(fulfill).catch(reject);
			} else {
				// Another action is running
				fulfill(false);
			}
		});
	}
}
