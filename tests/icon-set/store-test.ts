import type { IconifyIcons, IconifyJSON } from '@iconify/types';
import { storeLoadedIconSet } from '../../lib/data/icon-set/store/storage';
import { searchSplitRecordsTree } from '../../lib/data/storage/split';
import { createStorage } from '../../lib/data/storage/create';
import { getStoredItem } from '../../lib/data/storage/get';
import type { StoredIconSet } from '../../lib/types/icon-set/storage';
import type { MemoryStorageItem } from '../../lib/types/storage';
import { awaitTick, loadFixture, uniqueCacheDir } from '../helpers';

describe('Storing loaded icon set', () => {
	test('No storage, no splitting', async () => {
		const iconSet = JSON.parse(await loadFixture('json/mdi-light.json')) as IconifyJSON;

		// Create storage
		const dir = uniqueCacheDir();
		const cacheDir = '{cache}/' + dir;
		const storage = createStorage<IconifyIcons>({
			cacheDir,
		});

		// Split icon set
		function store(): Promise<StoredIconSet> {
			return new Promise((fulfill, reject) => {
				// Split icon set
				storeLoadedIconSet(iconSet, fulfill, storage, {
					chunkSize: 0,
					minIconsPerChunk: 100,
				});
			});
		}
		const storedIconSet = await store();

		// Simple test
		expect(storedIconSet.storage).toBe(storage);
		expect(storedIconSet.items.length).toBe(1);

		// Get item
		const storedItem = searchSplitRecordsTree(storedIconSet.tree, 'calendar');
		expect(storedItem).toBe(storedIconSet.tree.match);

		// Load it
		function getItem(): Promise<IconifyIcons | null> {
			return new Promise((fulfill, reject) => {
				getStoredItem(storage, storedItem, fulfill);
			});
		}
		const data = await getItem();
		expect(data).toBeTruthy();

		// Data should be identical because storage is disabled
		expect(data!['calendar']).toBe(iconSet.icons['calendar']);
	});

	test('Split icon set', async () => {
		const iconSet = JSON.parse(await loadFixture('json/mdi-light.json')) as IconifyJSON;

		// Create storage
		const dir = uniqueCacheDir();
		const cacheDir = '{cache}/' + dir;
		const storage = createStorage<IconifyIcons>({
			cacheDir,
		});

		// Split icon set
		function store(): Promise<StoredIconSet> {
			return new Promise((fulfill, reject) => {
				// Split icon set
				storeLoadedIconSet(iconSet, fulfill, storage, {
					chunkSize: 10000,
					minIconsPerChunk: 10,
				});
			});
		}
		const storedIconSet = await store();

		// Simple test
		expect(storedIconSet.storage).toBe(storage);
		expect(storedIconSet.items.length).toBe(6);

		// Get item from middle
		const storedItem = searchSplitRecordsTree(storedIconSet.tree, 'grid');
		expect(storedItem).toBe(storedIconSet.tree.match);

		// Get item from first tree item
		const firstStoredItem = searchSplitRecordsTree(storedIconSet.tree, 'alert');
		expect(firstStoredItem).not.toBe(storedIconSet.tree.match);
		expect(searchSplitRecordsTree(storedIconSet.tree, 'account')).toBe(firstStoredItem);

		// Load it
		function getItem(): Promise<IconifyIcons | null> {
			return new Promise((fulfill, reject) => {
				getStoredItem(storage, storedItem, fulfill);
			});
		}
		const data = await getItem();

		expect(data).toBeTruthy();

		// Data should be identical because storage is disabled
		expect(data!['grid']).toBe(iconSet.icons['grid']);

		// Icons from other chunks should not exist
		expect(data!['alert']).toBeUndefined();
		expect(data!['account']).toBeUndefined();
		expect(data!['repeat']).toBeUndefined();
	});

	test('Split and store icon set', async () => {
		const iconSet = JSON.parse(await loadFixture('json/mdi-light.json')) as IconifyJSON;

		// Create storage
		const dir = uniqueCacheDir();
		const cacheDir = '{cache}/' + dir;
		const storage = createStorage<IconifyIcons>({
			cacheDir,
			maxCount: 2,
		});

		// Split icon set
		function store(): Promise<StoredIconSet> {
			return new Promise((fulfill, reject) => {
				// Split icon set
				storeLoadedIconSet(iconSet, fulfill, storage, {
					chunkSize: 10000,
					minIconsPerChunk: 10,
				});
			});
		}
		const storedIconSet = await store();

		// Simple test
		expect(storedIconSet.storage).toBe(storage);
		expect(storedIconSet.items.length).toBe(6);

		// Get item from middle
		const storedItem = searchSplitRecordsTree(storedIconSet.tree, 'grid');
		expect(storedItem).toBe(storedIconSet.tree.match);

		// Get item from first tree item
		const firstStoredItem = searchSplitRecordsTree(storedIconSet.tree, 'alert');
		expect(firstStoredItem).not.toBe(storedIconSet.tree.match);
		expect(searchSplitRecordsTree(storedIconSet.tree, 'account')).toBe(firstStoredItem);

		// Load icon from middle
		function getItem(item: MemoryStorageItem<IconifyIcons>): Promise<IconifyIcons | null> {
			return new Promise((fulfill, reject) => {
				getStoredItem(storage, item, fulfill);
			});
		}
		const testItemData = await getItem(storedItem);

		expect(testItemData).toBeTruthy();

		// Data should be different because it is loaded from cache
		expect(testItemData!['grid']).toEqual(iconSet.icons['grid']);
		expect(testItemData!['grid']).not.toBe(iconSet.icons['grid']);

		// Icons from other chunks should not exist
		expect(testItemData!['alert']).toBeUndefined();
		expect(testItemData!['account']).toBeUndefined();
		expect(testItemData!['repeat']).toBeUndefined();

		// Load icon from first chunk
		const item1Data = await getItem(firstStoredItem);

		expect(item1Data).toBeTruthy();

		// Data should be different because it is loaded from cache
		expect(item1Data!['alert']).toEqual(iconSet.icons['alert']);
		expect(item1Data!['alert']).not.toBe(iconSet.icons['alert']);

		// Check storage on next tick: watched items list is updated after this callback
		await awaitTick();

		// Only 2 items loaded in this test should be loaded and watched
		expect(storage.watched.size).toBe(2);
		expect(storage.watched.has(firstStoredItem)).toBe(true);
		expect(storage.watched.has(storedItem)).toBe(true);

		// Test all items
		expect(storedIconSet.items.length).toBe(6);
		expect(storedIconSet.items[0].data).toBe(item1Data);
		expect(storedIconSet.items[1].data).toBeUndefined();
		expect(storedIconSet.items[2].data).toBeUndefined();
		expect(storedIconSet.items[3].data).toBe(testItemData);
		expect(storedIconSet.items[4].data).toBeUndefined();
		expect(storedIconSet.items[5].data).toBeUndefined();
	});
});
