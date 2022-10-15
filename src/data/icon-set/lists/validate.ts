import type { IconifyJSON } from '@iconify/types';
import type { IconSetIconsListIcons } from '../../../types/icon-set/extra';

/**
 * Removes bad aliases
 */
export function removeBadAliases(data: IconifyJSON, iconsList: IconSetIconsListIcons) {
	const aliases = data.aliases;
	if (!aliases) {
		return;
	}
	iconsList.failed.forEach((name) => {
		delete aliases[name];
	});
}
