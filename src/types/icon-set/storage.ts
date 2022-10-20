import type { IconifyIcons, IconifyInfo } from '@iconify/types';
import type { SplitDataTree } from '../split';
import type { MemoryStorage, MemoryStorageItem } from '../storage';
import type { IconSetAPIv2IconsList, IconSetIconsListIcons } from './extra';
import type { SplitIconifyJSONMainData } from './split';

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

	// TODO: add properties for search data
}

/**
 * Callback
 */
export type StoredIconSetDone = (result: StoredIconSet) => void;
