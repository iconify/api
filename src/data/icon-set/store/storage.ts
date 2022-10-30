import type { IconifyIcons, IconifyJSON } from '@iconify/types';
import { appConfig, splitIconSetConfig, storageConfig } from '../../../config/app';
import type { SplitIconSetConfig } from '../../../types/config/split';
import type { StorageIconSetThemes, StoredIconSet, StoredIconSetDone } from '../../../types/icon-set/storage';
import type { SplitRecord } from '../../../types/split';
import type { MemoryStorage, MemoryStorageItem } from '../../../types/storage';
import { createSplitRecordsTree, splitRecords } from '../../storage/split';
import { createStorage, createStoredItem } from '../../storage/create';
import { getIconSetSplitChunksCount, splitIconSetMainData } from './split';
import { removeBadIconSetItems } from '../lists/validate';
import { prepareAPIv2IconsList } from '../lists/icons-v2';
import { generateIconSetIconsTree } from '../lists/icons';

/**
 * Storage
 */
export const iconSetsStorage = createStorage<IconifyIcons>(storageConfig);

/**
 * Themes to copy
 */
const themeKeys: (keyof StorageIconSetThemes)[] = ['themes', 'prefixes', 'suffixes'];

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
	const icons = generateIconSetIconsTree(iconSet);
	removeBadIconSetItems(iconSet, icons);

	// Fix icons counter
	if (iconSet.info) {
		iconSet.info.total = icons.total;
	}

	// Get common items
	const common = splitIconSetMainData(iconSet);

	// Get themes
	const themes: StorageIconSetThemes = {};
	if (appConfig.enableIconLists) {
		for (let i = 0; i < themeKeys.length; i++) {
			const key = themeKeys[i];
			if (iconSet[key]) {
				themes[key as 'prefixes'] = iconSet[key as 'prefixes'];
			}
		}
	}

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
				icons,
			};
			if (iconSet.info) {
				result.info = iconSet.info;
			}
			if (appConfig.enableIconLists) {
				for (const key in themes) {
					result.themes = themes;
					break;
				}
				result.apiV2IconsCache = prepareAPIv2IconsList(iconSet, icons);
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
		storeLoadedIconSet(
			iconSet,
			(data: StoredIconSet) => {
				// Purge unused memory if garbage collector global is exposed
				try {
					global.gc?.();
				} catch {}

				fulfill(data);
			},
			storage,
			config
		);
	});
}
