import { createStorage, createStoredItem } from '../../lib/data/storage/create';
import { cleanupStorage } from '../../lib/data/storage/cleanup';
import { getStoredItem } from '../../lib/data/storage/get';
import type { MemoryStorageItem } from '../../lib/types/storage';
import { uniqueCacheDir } from '../helpers';

describe('Advanced storage tests', () => {
	test('Big set of data, limit to 2', () => {
		return new Promise((fulfill, reject) => {
			try {
				interface Item {
					i: number;
					title: string;
				}

				const dir = uniqueCacheDir();
				const cacheDir = '{cache}/' + dir;
				const storage = createStorage<Item>({
					cacheDir,
					maxCount: 2,
					asyncRead: true,
				});

				// Create items
				const items: MemoryStorageItem<Item>[] = [];
				const limit = 10;
				const pending = new Set();
				const createdItem = () => {
					try {
						if (!pending.size) {
							// All items have been created and should have been cleaned up. Continue testing...
							expect(storage.watched.size).toBe(0);
							items.forEach((item, i) => {
								expect(item.data).toBeUndefined();
								expect(item.cache).toEqual({
									filename: `cache/${dir}/item-${i}.json`,
									exists: true,
								});
							});

							// Load all even items, which is more than allowed limit
							const pendingLoad: Set<MemoryStorageItem<Item>> = new Set();
							const loadedItem = (lastItem: MemoryStorageItem<Item>) => {
								if (!pendingLoad.size) {
									// All items have been loaded
									// Last item should not be watched yet: it is added after callbacks are ran, but
									// this code is ran inside a callback
									expect(storage.watched.size).toBe(Math.floor(limit / 2) - 1);

									for (let i = 0; i < limit; i++) {
										const item = items[i];
										expect(storage.watched.has(item)).toBe(i % 2 === 0 && item !== lastItem);
									}

									// Wait for next tick to add `lastItem` to watched items
									setTimeout(() => {
										try {
											expect(storage.watched.size).toBe(Math.floor(limit / 2));
											expect(lastItem.data).toBeDefined();

											// Fake expiration for last item and run cleanup process
											lastItem.lastUsed -= 100000;
											if (storage.minLastUsed) {
												storage.minLastUsed -= 100000;
											}
											cleanupStorage(storage);

											// Only `lastItem` should have been removed
											expect(lastItem.data).toBeUndefined();
											expect(storage.watched.size).toBe(Math.floor(limit / 2) - 1);

											// Load last item again
											getStoredItem(storage, lastItem, (data) => {
												try {
													expect(data).toBeTruthy();
													expect(lastItem.data).toBe(data);
													expect(storage.watched.has(lastItem)).toBe(false);

													// Should be re-added to watched list on next tick
													setTimeout(() => {
														try {
															expect(storage.watched.has(lastItem)).toBe(true);

															fulfill(true);
														} catch (err) {
															reject(err);
														}
													});
												} catch (err) {
													reject(err);
												}
											});
										} catch (err) {
											reject(err);
										}
									});
								}
							};

							for (let i = 0; i < limit; i += 2) {
								const item = items[i];
								pendingLoad.add(item);
								getStoredItem(storage, item, (data) => {
									try {
										pendingLoad.delete(item);
										expect(data).toBeTruthy();
										loadedItem(item);
									} catch (err) {
										reject(err);
									}
								});
							}

							// Test continues in loadedItem()...
						}
					} catch (err) {
						reject(err);
					}
				};
				for (let i = 0; i < limit; i++) {
					const item = createStoredItem<Item>(
						storage,
						{
							i,
							title: `Item ${i}`,
						},
						`item-${i}.json`,
						true,
						(item) => {
							pending.delete(item);
							createdItem();
						}
					);
					pending.add(item);
					items.push(item);
				}

				// All items should be pending, but not watched
				expect(pending.size).toBe(limit);
				expect(storage.watched.size).toBe(0);

				// Test continues in createdItem()...
			} catch (err) {
				reject(err);
			}
		});
	});
});
