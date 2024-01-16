import { IconifyJSON } from '@iconify/types';
import { StorageIconSetThemes } from '../../../types/icon-set/storage.js';

/**
 * Themes to copy
 */
export const themeKeys: (keyof StorageIconSetThemes)[] = ['prefixes', 'suffixes'];

/**
 * Hardcoded list of themes
 *
 * Should contain only simple items, without '-'
 */
const hardcodedThemes: Set<string> = new Set([
	'baseline',
	'outline',
	'round',
	'sharp',
	'twotone',
	'thin',
	'light',
	'bold',
	'fill',
	'duotone',
	'linear',
	'line',
	'solid',
	'filled',
	'outlined',
]);

/**
 * Find icon
 */
export function findIconSetThemes(iconSet: IconifyJSON): string[] {
	const results: Set<string> = new Set();

	// Add prefixes / suffixes from themes
	themeKeys.forEach((key) => {
		const items = iconSet[key];
		if (items) {
			Object.keys(items).forEach((item) => {
				if (item) {
					results.add(item);
				}
			});
		}
	});

	// Check all icons and aliases
	const names = Object.keys(iconSet.icons).concat(Object.keys(iconSet.aliases || {}));
	for (let i = 0; i < names.length; i++) {
		const name = names[i];
		const parts = name.split('-');
		if (parts.length > 1) {
			const firstChunk = parts.shift() as string;
			const lastChunk = parts.pop() as string;
			if (hardcodedThemes.has(firstChunk)) {
				results.add(firstChunk);
			}
			if (hardcodedThemes.has(lastChunk)) {
				results.add(lastChunk);
			}
		}
	}

	// Return as array, sorted by length
	return Array.from(results).sort((a, b) => b.length - a.length);
}
