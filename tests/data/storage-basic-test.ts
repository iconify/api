import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { appConfig } from '../../lib/config/app';
import { createStorage, createStoredItem } from '../../lib/data/storage/create';
import { uniqueCacheDir } from '../helpers';
import type { MemoryStorageItem } from '../../lib/types/storage';

describe('Basic data storage tests', () => {
	test('Storage with default config', () => {
		const dir = uniqueCacheDir();
		const cacheDir = '{cache}/' + dir;
		const storage = createStorage({
			cacheDir,
		});

		// Config
		expect(storage.config).toEqual({
			cacheDir,
		});

		// Timer should not exist
		expect(storage.timer).toBeUndefined();

		// Add one item
		const item = createStoredItem(
			storage,
			{
				test: true,
			},
			'foo.json'
		);

		// Nothing should have changed because config doesn't store anything
		expect(item.cache).toEqual({
			filename: 'cache/' + dir + '/foo.json',
			exists: false,
		});
		expect(storage.timer).toBeUndefined();
		expect(storage.watched.size).toBe(0);
		expect(storage.pendingWrites.size).toBe(0);
		expect(storage.pendingReads.size).toBe(0);
	});

	test('Storage with limited number of items', () => {
		return new Promise((fulfill, reject) => {
			try {
				const dir = uniqueCacheDir();
				const cacheDir = '{cache}/' + dir;
				const storage = createStorage({
					cacheDir,
					maxCount: 2,
				});

				// Config
				expect(storage.config).toEqual({
					cacheDir,
					maxCount: 2,
				});

				// Timer should not exist
				expect(storage.timer).toBeUndefined();

				// Add one item
				let isSync = true;
				const content = {
					test: true,
				};
				const item = createStoredItem(storage, content, 'foo.json', false, (item) => {
					// Async write, wrap in try..catch to reject with error
					try {
						expect(isSync).toBeFalsy();

						expect(item.cache).toEqual({
							filename: 'cache/' + dir + '/foo.json',
							exists: true,
						});
						expect(item.data).toEqual(content);

						// Expecting no pending writes, 1 watched item, no timer
						expect(storage.timer).toBeUndefined();
						expect(storage.watched.size).toBe(1);
						expect(storage.pendingWrites.size).toBe(0);
						expect(storage.pendingReads.size).toBe(0);
					} catch (err) {
						reject(err);
						return;
					}

					// Done
					fulfill(true);
				});

				// Expecting 1 pending write, but no timer
				expect(item.cache).toEqual({
					filename: 'cache/' + dir + '/foo.json',
					exists: false,
				});
				expect(item.data).toEqual(content);

				expect(storage.timer).toBeUndefined();
				expect(storage.watched.size).toBe(0);
				expect(storage.pendingWrites.size).toBe(1);
				expect(storage.pendingReads.size).toBe(0);

				isSync = false;

				// Test continues in callback in createStoredItem()...
			} catch (err) {
				reject(err);
			}
		});
	});

	test('Storage with limited number of items, autoCleanup', () => {
		return new Promise((fulfill, reject) => {
			try {
				const dir = uniqueCacheDir();
				const cacheDir = '{cache}/' + dir;
				const storage = createStorage({
					cacheDir,
					maxCount: 2,
				});

				// Config
				expect(storage.config).toEqual({
					cacheDir,
					maxCount: 2,
				});

				// Timer should not exist
				expect(storage.timer).toBeUndefined();

				// Add one item
				let isSync = true;
				const content = {
					test: true,
				};
				const item = createStoredItem(storage, content, 'foo.json', true, (item) => {
					// Async write, wrap in try..catch to reject with error
					try {
						expect(isSync).toBeFalsy();

						expect(item.cache).toEqual({
							filename: 'cache/' + dir + '/foo.json',
							exists: true,
						});

						// Data should be unset
						expect(item.data).toBeUndefined();

						// Expecting no pending writes, 0 watched items, no timer
						expect(storage.timer).toBeUndefined();
						expect(storage.watched.size).toBe(0);
						expect(storage.pendingWrites.size).toBe(0);
						expect(storage.pendingReads.size).toBe(0);
					} catch (err) {
						reject(err);
						return;
					}

					// Done
					fulfill(true);
				});

				// Expecting 1 pending write, but no timer
				expect(item.cache).toEqual({
					filename: 'cache/' + dir + '/foo.json',
					exists: false,
				});
				expect(item.data).toEqual(content);

				expect(storage.timer).toBeUndefined();
				expect(storage.watched.size).toBe(0);
				expect(storage.pendingWrites.size).toBe(1);
				expect(storage.pendingReads.size).toBe(0);

				isSync = false;

				// Test continues in callback in createStoredItem()...
			} catch (err) {
				reject(err);
			}
		});
	});

	test('Storage with limited number of items, autoCleanup, item with use time', () => {
		return new Promise((fulfill, reject) => {
			try {
				const dir = uniqueCacheDir();
				const cacheDir = '{cache}/' + dir;
				const storage = createStorage({
					cacheDir,
					maxCount: 2,
				});

				// Config
				expect(storage.config).toEqual({
					cacheDir,
					maxCount: 2,
				});

				// Timer should not exist
				expect(storage.timer).toBeUndefined();

				// Add one item
				let isSync = true;
				const content = {
					test: true,
				};
				const item = createStoredItem(storage, content, 'foo.json', true, (item) => {
					// Async write, wrap in try..catch to reject with error
					try {
						expect(isSync).toBeFalsy();

						expect(item.cache).toEqual({
							filename: 'cache/' + dir + '/foo.json',
							exists: true,
						});

						// Data should be set because lastUsed was set
						expect(item.data).toBe(content);

						// Expecting no pending writes, 1 watched item, no timer
						expect(storage.timer).toBeUndefined();
						expect(storage.watched.size).toBe(1);
						expect(storage.pendingWrites.size).toBe(0);
						expect(storage.pendingReads.size).toBe(0);
					} catch (err) {
						reject(err);
						return;
					}

					// Done
					fulfill(true);
				});

				// Expecting 1 pending write, but no timer
				expect(item.cache).toEqual({
					filename: 'cache/' + dir + '/foo.json',
					exists: false,
				});
				expect(item.data).toEqual(content);

				expect(storage.timer).toBeUndefined();
				expect(storage.watched.size).toBe(0);
				expect(storage.pendingWrites.size).toBe(1);
				expect(storage.pendingReads.size).toBe(0);

				// Set last use time
				item.lastUsed = Date.now();

				isSync = false;

				// Test continues in callback in createStoredItem()...
			} catch (err) {
				reject(err);
			}
		});
	});

	test('Storage with timer', () => {
		return new Promise((fulfill, reject) => {
			try {
				const dir = uniqueCacheDir();
				const cacheDir = '{cache}/' + dir;

				// Callback for debugging. Because function relies on data provided after creating
				// config, it is assigned later, after test item is created
				let callback: () => void | undefined;
				const timerCallback = () => {
					if (!callback) {
						reject('Timer was called before timerCallback is set');
					} else {
						callback();
					}
				};

				// Create storage
				const storage = createStorage({
					cacheDir,
					timer: 50,
					cleanupAfter: 150,
					minExpiration: 1,
					timerCallback,
				});

				// Config
				expect(storage.config).toEqual({
					cacheDir,
					timer: 50,
					cleanupAfter: 150,
					minExpiration: 1,
					timerCallback,
				});

				// Timer should not exist
				expect(storage.timer).toBeUndefined();

				// Add one item
				let isSync = true;
				const content = {
					test: true,
				};
				const item = createStoredItem(storage, content, 'foo.json', false, (item) => {
					// Async write, wrap in try..catch to reject with error
					try {
						expect(isSync).toBeFalsy();

						expect(item.cache).toEqual({
							filename: 'cache/' + dir + '/foo.json',
							exists: true,
						});

						// Data should not be unset yet
						expect(item.data).toBe(content);

						// Expecting no pending writes, 1 watched item and timer
						expect(storage.timer).toBeTruthy();
						expect(storage.watched.size).toBe(1);
						expect(storage.pendingWrites.size).toBe(0);
						expect(storage.pendingReads.size).toBe(0);
					} catch (err) {
						reject(err);
						return;
					}

					// Wait for cleanup
					let count = 0;
					callback = () => {
						if (count++ > 5) {
							// Too much waiting!
							clearInterval(storage.timer);
							reject('Delay is too long');
							return;
						}

						// Data should exist
						expect(item.data).toBeTruthy();

						// Test on next tick, after cleanup
						setTimeout(() => {
							if (item.data) {
								// Not cleaned up yet
								return;
							}

							// Clear timer before testing
							clearInterval(storage.timer);

							try {
								// Data should be unset
								expect(item.data).toBeUndefined();

								// Expecting no pending writes, 0 watched items, no timer
								expect(storage.timer).toBeUndefined();
								expect(storage.watched.size).toBe(0);
								expect(storage.pendingWrites.size).toBe(0);
								expect(storage.pendingReads.size).toBe(0);

								// Done
								fulfill(true);
							} catch (err) {
								reject(err);
							}
						});
					};
				});

				// Expecting 1 pending write, no timer
				expect(item.cache).toEqual({
					filename: 'cache/' + dir + '/foo.json',
					exists: false,
				});
				expect(item.data).toEqual(content);

				expect(storage.timer).toBeUndefined();
				expect(storage.watched.size).toBe(0);
				expect(storage.pendingWrites.size).toBe(1);
				expect(storage.pendingReads.size).toBe(0);

				isSync = false;

				// Test continues in callback in createStoredItem()...
			} catch (err) {
				reject(err);
			}
		});
	});

	test('Error writing cache', () => {
		return new Promise((fulfill, reject) => {
			try {
				interface TestItem {
					i: number;
				}

				const dir = uniqueCacheDir();
				const cacheDir = '{cache}/' + dir;

				// Create file instead of directory to fail
				const filename = cacheDir.replace('{cache}', appConfig.cacheRootDir);
				try {
					mkdirSync(dirname(filename), {
						recursive: true,
					});
				} catch {}
				try {
					writeFileSync(filename, 'test', 'utf8');
				} catch (err) {
					reject(err);
					return;
				}

				const storage = createStorage<TestItem>({
					cacheDir,
					maxCount: 1,
				});

				// Add few items
				const numItems = 5;
				let counter = numItems;
				const items: MemoryStorageItem<TestItem>[] = [];
				for (let i = 0; i < numItems; i++) {
					createStoredItem<TestItem>(
						storage,
						{
							i,
						},
						`${i}.json`,
						true,
						(item, err) => {
							try {
								items.push(item);

								expect(err).toBeTruthy();
								expect(item.data).toBeTruthy();
								expect(item.cache).toBeTruthy();
								expect(item.cache!.exists).toBeFalsy();

								counter--;
								if (!counter) {
									// All items have been created
									expect(items.length).toBe(numItems);
									for (let i = 0; i < numItems; i++) {
										expect(items[i].data).toBeTruthy();
									}

									fulfill(true);
								}
							} catch (err) {
								reject(err);
							}
						}
					);
				}

				// Test continues in callback in createStoredItem()...
			} catch (err) {
				reject(err);
			}
		});
	});
});
