import { IconifyJSON } from '@iconify/types';
import { getStoredIconsData } from '../../data/icon-set/utils/get-icons.js';
import { iconSets } from '../../data/icon-sets.js';

/**
 * Generate icons data
 */
export function createIconsDataResponse(
	prefix: string,
	q: Record<string, string | string[]>
): number | IconifyJSON | Promise<IconifyJSON | number> {
	const iconNames = q.icons;
	const names = typeof iconNames === 'string' ? iconNames.split(',') : iconNames;

	if (!names || !names.length) {
		// Missing or invalid icons parameter
		return 404;
	}

	// Get icon set
	const iconSet = iconSets[prefix];
	if (!iconSet) {
		// No such icon set
		return 404;
	}

	// Get icons, possibly sync
	let syncData: IconifyJSON | undefined;
	let resolveData: undefined | ((data: IconifyJSON) => void);

	getStoredIconsData(iconSet.item, names, (data) => {
		// Send data
		if (resolveData) {
			resolveData(data);
		} else {
			syncData = data;
		}
	});

	if (syncData) {
		return syncData;
	}
	return new Promise((resolve) => {
		resolveData = resolve;
	});
}

/**
 * Awaitable version of createIconsDataResponse()
 */
export function createIconsDataResponseAsync(
	prefix: string,
	q: Record<string, string | string[]>
): Promise<IconifyJSON | number> {
	return new Promise((resolve, reject) => {
		const result = createIconsDataResponse(prefix, q);
		if (result instanceof Promise) {
			result.then(resolve).catch(reject);
		} else {
			resolve(result);
		}
	});
}
