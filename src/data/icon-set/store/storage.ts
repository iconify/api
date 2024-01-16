import type { IconifyIcons, IconifyJSON } from '@iconify/types';
import { appConfig, splitIconSetConfig, storageConfig } from '../../../config/app.js';
import type { SplitIconSetConfig } from '../../../types/config/split.js';
import type { StorageIconSetThemes, StoredIconSet, StoredIconSetDone } from '../../../types/icon-set/storage.js';
import type { SplitRecord } from '../../../types/split.js';
import type { MemoryStorage, MemoryStorageItem } from '../../../types/storage.js';
import { createSplitRecordsTree, splitRecords } from '../../storage/split.js';
import { createStorage, createStoredItem } from '../../storage/create.js';
import { getIconSetSplitChunksCount, splitIconSetMainData } from './split.js';
import { removeBadIconSetItems } from '../lists/validate.js';
import { prepareAPIv2IconsList } from '../lists/icons-v2.js';
import { generateIconSetIconsTree } from '../lists/icons.js';
import { themeKeys, findIconSetThemes } from './themes.js';

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
	let themes: StorageIconSetThemes | undefined;
	let themeParts: string[] | undefined;

	if (appConfig.enableIconLists) {
		// Get themes
		if (appConfig.enableIconLists) {
			const themesList: StorageIconSetThemes = {};
			for (let i = 0; i < themeKeys.length; i++) {
				const key = themeKeys[i];
				if (iconSet[key]) {
					themesList[key as 'prefixes'] = iconSet[key as 'prefixes'];
					themes = themesList;
				}
			}

			// Get common parts of icon names for optimised search
			if (appConfig.enableSearchEngine) {
				const data = findIconSetThemes(iconSet);
				if (data.length) {
					themeParts = data;
				}
			}
		}
	}

	// Get icons
	const icons = generateIconSetIconsTree(iconSet, themeParts);
	removeBadIconSetItems(iconSet, icons);

	// Fix icons counter
	if (iconSet.info) {
		iconSet.info.total = icons.total;
	}

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
				icons,
				themes,
			};
			if (iconSet.info) {
				result.info = iconSet.info;
			}
			if (appConfig.enableIconLists) {
				result.apiV2IconsCache = prepareAPIv2IconsList(iconSet, icons);
				if (appConfig.enableSearchEngine && themeParts?.length) {
					result.themeParts = themeParts;
				}
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
