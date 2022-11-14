import { unlinkSync } from 'node:fs';
import { appConfig } from '../../lib/config/app';
import { createStorage, createStoredItem } from '../../lib/data/storage/create';
import { getStoredItem } from '../../lib/data/storage/get';
import { uniqueCacheDir } from '../helpers';

describe('Reading stored data', () => {
	test('Instant callback', () => {
		return new Promise((fulfill, reject) => {
			try {
				const dir = uniqueCacheDir();
				const cacheDir = '{cache}/' + dir;
				const storage = createStorage({
					cacheDir,
					maxCount: 2,
					asyncRead: true,
				});

				// Config
				expect(storage.config).toEqual({
					cacheDir,
					maxCount: 2,
					asyncRead: true,
				});

				// Timer should not exist
				expect(storage.timer).toBeUndefined();

				// Add one item
				let isSync = true;
				const content = {
					test: true,
				};
				const item = createStoredItem(storage, content, 'foo.json', false, () => {
					// Data should be set
					expect(item.data).toEqual(content);

					// Timer should not be set
					if (storage.timer) {
						clearInterval(storage.timer);
						reject('Timer is active');
					}

					fulfill(true);
				});

				// Get data
				getStoredItem(storage, item, (data) => {
					try {
						// Should be sync
						expect(isSync).toBeTruthy();
						expect(data).toEqual(content);
					} catch (err) {
						reject(err);
					}
				});

				isSync = false;

				// Test continues in callback in getStoredItem(), then in callback in createStoredItem()...
			} catch (err) {
				reject(err);
			}
		});
	});

	test('Instant callback, autoCleanup', () => {
		return new Promise((fulfill, reject) => {
			try {
				const dir = uniqueCacheDir();
				const cacheDir = '{cache}/' + dir;
				const storage = createStorage({
					cacheDir,
					maxCount: 2,
					asyncRead: true,
				});

				// Config
				expect(storage.config).toEqual({
					cacheDir,
					maxCount: 2,
					asyncRead: true,
				});

				// Timer should not exist
				expect(storage.timer).toBeUndefined();

				// Add one item
				let isSync = true;
				const content = {
					test: true,
				};
				const item = createStoredItem(storage, content, 'foo.json', true, () => {
					// Data should be set, even though autoCleanup is enabled because read was called earlier
					expect(item.data).toEqual(content);

					// Timer should not be set
					if (storage.timer) {
						clearInterval(storage.timer);
						reject('Timer is active');
					}

					fulfill(true);
				});

				// Get data
				getStoredItem(storage, item, (data) => {
					try {
						// Should be sync
						expect(isSync).toBeTruthy();
						expect(data).toEqual(content);
					} catch (err) {
						reject(err);
					}
				});

				isSync = false;

				// Test continues in callback in getStoredItem(), then in callback in createStoredItem()...
			} catch (err) {
				reject(err);
			}
		});
	});

	test('Delayed callback', () => {
		return new Promise((fulfill, reject) => {
			try {
				const dir = uniqueCacheDir();
				const cacheDir = '{cache}/' + dir;
				const storage = createStorage({
					cacheDir,
					maxCount: 2,
					asyncRead: true,
				});

				// Config
				expect(storage.config).toEqual({
					cacheDir,
					maxCount: 2,
					asyncRead: true,
				});

				// Timer should not exist
				expect(storage.timer).toBeUndefined();

				// Add one item
				const content = {
					test: true,
				};
				const item = createStoredItem(storage, content, 'foo.json', true, () => {
					try {
						let isSync = true;
						let cb1 = false;
						let cb2 = false;

						// Data should be unset
						expect(item.data).toBeUndefined();

						// Get data, attempt #1
						getStoredItem(storage, item, (data) => {
							try {
								// Should be async
								expect(isSync).toBeFalsy();
								expect(data).toEqual(content);
								expect(cb1).toBeFalsy();
								cb1 = true;

								// Content should be set, but not identical to original data
								expect(item.data).toEqual(content);
								expect(item.data).not.toBe(content);
							} catch (err) {
								reject(err);
							}
						});

						// Get data, attempt #2
						getStoredItem(storage, item, (data) => {
							try {
								// Should be async
								expect(isSync).toBeFalsy();
								expect(data).toEqual(content);
								expect(cb2).toBeFalsy();
								cb2 = true;

								// Attempt #1 should have been done too
								expect(cb1).toBeTruthy();

								// Timer should not be set
								if (storage.timer) {
									clearInterval(storage.timer);
									reject('Timer is active');
								}

								// Done
								fulfill(true);
							} catch (err) {
								reject(err);
							}
						});

						isSync = false;

						// Test continues in callbacks in getStoredItem()...
					} catch (err) {
						reject(err);
					}
				});
			} catch (err) {
				reject(err);
			}
		});
	});

	test('Error reading cache asynchronously', () => {
		return new Promise((fulfill, reject) => {
			try {
				const dir = uniqueCacheDir();
				const cacheDir = '{cache}/' + dir;
				const actualCacheDir = cacheDir.replace('{cache}', appConfig.cacheRootDir);

				const storage = createStorage({
					cacheDir,
					maxCount: 1,
					asyncRead: true,
				});

				// Add one item
				const content = {
					test: true,
				};
				createStoredItem(storage, content, 'foo.json', true, (item, err) => {
					try {
						// Data should be written to cache
						expect(item.data).toBeUndefined();

						// Remove cache file
						unlinkSync(actualCacheDir + '/foo.json');

						// Attempt to read data
						getStoredItem(storage, item, (data) => {
							try {
								expect(data).toBeFalsy();
								fulfill(true);
							} catch (err) {
								reject(err);
							}
						});
					} catch (err) {
						reject(err);
					}
				});

				// Test continues in callback in createStoredItem()...
			} catch (err) {
				reject(err);
			}
		});
	});

	test('Error reading cache synchronously', () => {
		return new Promise((fulfill, reject) => {
			try {
				const dir = uniqueCacheDir();
				const cacheDir = '{cache}/' + dir;
				const actualCacheDir = cacheDir.replace('{cache}', appConfig.cacheRootDir);

				const storage = createStorage({
					cacheDir,
					maxCount: 1,
					asyncRead: false,
				});

				// Add one item
				const content = {
					test: true,
				};
				createStoredItem(storage, content, 'foo.json', true, (item, err) => {
					try {
						// Data should be written to cache
						expect(item.data).toBeUndefined();

						// Remove cache file
						unlinkSync(actualCacheDir + '/foo.json');

						// Attempt to read data
						getStoredItem(storage, item, (data) => {
							try {
								expect(data).toBeFalsy();
								fulfill(true);
							} catch (err) {
								reject(err);
							}
						});
					} catch (err) {
						reject(err);
					}
				});

				// Test continues in callback in createStoredItem()...
			} catch (err) {
				reject(err);
			}
		});
	});
});
