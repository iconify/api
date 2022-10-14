import type { IconifyIcons, IconifyInfo, IconifyJSON } from '@iconify/types';
import type { SplitDataTree, SplitRecord } from '../split';
import type { MemoryStorage, MemoryStorageItem } from '../storage';
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

	// TODO: add properties for search data
}

/**
 * Callback
 */
export type StoredIconSetDone = (result: StoredIconSet) => void;
