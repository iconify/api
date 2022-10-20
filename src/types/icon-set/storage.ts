import type { IconifyIcons, IconifyInfo, IconifyJSON } from '@iconify/types';
import type { SplitDataTree } from '../split';
import type { MemoryStorage, MemoryStorageItem } from '../storage';
import type { IconSetIconsListIcons, IconSetAPIv2IconsList } from './extra';
import type { SplitIconifyJSONMainData } from './split';

/**
 * Themes
 */
export interface StorageIconSetThemes {
	themes?: IconifyJSON['themes'];
	prefixes?: IconifyJSON['prefixes'];
	suffixes?: IconifyJSON['suffixes'];
}

/**
 * Generated data
 */
export interface StoredIconSet {
	// Icon set information
	info?: IconifyInfo;

	// Common data
	common: SplitIconifyJSONMainData;

	// Storage reference
	storage: MemoryStorage<IconifyIcons>;

	// Split chunks, stored in storage
	items: MemoryStorageItem<IconifyIcons>[];
	tree: SplitDataTree<MemoryStorageItem<IconifyIcons>>;

	// Icons list
	icons: IconSetIconsListIcons;
	apiV2IconsCache?: IconSetAPIv2IconsList;

	// Themes
	themes?: StorageIconSetThemes;

	// TODO: add properties for search data
}

/**
 * Callback
 */
export type StoredIconSetDone = (result: StoredIconSet) => void;
