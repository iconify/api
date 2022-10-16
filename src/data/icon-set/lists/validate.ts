import type { IconifyJSON } from '@iconify/types';
import type { IconSetIconsListIcons } from '../../../types/icon-set/extra';

/**
 * Removes bad items
 */
export function removeBadIconSetItems(data: IconifyJSON, iconsList: IconSetIconsListIcons) {
	// Remove bad aliases
	const aliases = data.aliases;
	if (aliases) {
		iconsList.failed.forEach((name) => {
			delete aliases[name];
		});
	}

	// Remove bad characters
	const chars = iconsList.chars;
	if (chars) {
		for (const key in chars) {
			if (iconsList.names.has(key) || !iconsList.names.has(chars[key])) {
				// Character matches existing icon or points to missing icon
				// Also deletes data.chars[key] because it points to same object
				delete chars[key];
			}
		}
	}
}
