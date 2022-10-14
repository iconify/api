import type { IconifyIcons, IconifyJSON } from '@iconify/types';
import { splitIconSetConfig, storageConfig } from '../../../config/app';
import type { SplitIconSetConfig } from '../../../types/config/split';
import type { StoredIconSet, StoredIconSetDone } from '../../../types/icon-set/storage';
import type { SplitRecord } from '../../../types/split';
import type { MemoryStorage, MemoryStorageItem } from '../../../types/storage';
import { createSplitRecordsTree, splitRecords } from '../../storage/split';
import { createStorage, createStoredItem } from '../../storage/create';
import { getIconSetSplitChunksCount, splitIconSetMainData } from './split';

/**
 * Storage
 */
export const iconSetsStorage = createStorage<IconifyIcons>(storageConfig);

/**
 * Counter for prefixes
 */
let counter = Date.now();

/**
 * Split and store icon set
 */
export function storeLoadedIconSet(
	iconSet: IconifyJSON,
	done: StoredIconSetDone,
	// Optional parameters, can be changed if needed
	storage: MemoryStorage<IconifyIcons> = iconSetsStorage,
	config: SplitIconSetConfig = splitIconSetConfig
) {
	// Get common items
	const common = splitIconSetMainData(iconSet);

	// Get number of chunks
	const chunksCount = getIconSetSplitChunksCount(iconSet.icons, config);

	// Stored items
	const splitItems: SplitRecord<MemoryStorageItem<IconifyIcons>>[] = [];
	const storedItems: MemoryStorageItem<IconifyIcons>[] = [];

	// Split
	const cachePrefix = `${iconSet.prefix}.${counter++}.`;
	splitRecords(
		iconSet.icons,
		chunksCount,
		(splitIcons, next, index) => {
			// Store data
			createStoredItem<IconifyIcons>(storage, splitIcons.data, cachePrefix + index, true, (storedItem) => {
				// Create split record for stored item
				const storedSplitItem: SplitRecord<typeof storedItem> = {
					keyword: splitIcons.keyword,
					data: storedItem,
				};
				storedItems.push(storedItem);
				splitItems.push(storedSplitItem);
				next();
			});
		},
		() => {
			// Create tree
			const tree = createSplitRecordsTree(splitItems);

			// Generate result
			const result: StoredIconSet = {
				common,
				storage,
				items: storedItems,
				tree,
			};
			if (iconSet.info) {
				result.info = iconSet.info;
			}
			done(result);
		}
	);
}

/**
 * Promise version of storeLoadedIconSet()
 */
export function asyncStoreLoadedIconSet(
	iconSet: IconifyJSON,
	// Optional parameters, can be changed if needed
	storage: MemoryStorage<IconifyIcons> = iconSetsStorage,
	config: SplitIconSetConfig = splitIconSetConfig
): Promise<StoredIconSet> {
	return new Promise((fulfill) => {
		storeLoadedIconSet(iconSet, fulfill, storage, config);
	});
}
