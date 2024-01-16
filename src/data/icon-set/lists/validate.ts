import type { IconifyJSON } from '@iconify/types';
import type { IconSetIconsListIcons } from '../../../types/icon-set/extra.js';

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
		const visible = iconsList.visible;
		const hidden = iconsList.hidden;
		for (const key in chars) {
			if (visible[key] || hidden[key]) {
				// Character matches existing icon
				delete chars[key];
			}
		}
	}
}
