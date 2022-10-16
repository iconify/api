import type { IconifyJSON } from '@iconify/types';
import type { IconSetAPIv2IconsList, IconSetIconsListIcons } from '../../../types/icon-set/extra';

type ThemeKey = 'themes' | 'prefixes' | 'suffixes';
const themeKeys: ThemeKey[] = ['themes', 'prefixes', 'suffixes'];

/**
 * Prepare data for icons list API v2 response
 */
export function prepareAPIv2IconsList(iconSet: IconifyJSON, iconsList: IconSetIconsListIcons): IconSetAPIv2IconsList {
	// Prepare data
	const result: IconSetAPIv2IconsList = {
		prefix: iconSet.prefix,
		total: iconsList.visible.size,
	};

	const info = iconSet.info;
	if (info) {
		result.title = info.name;
		result.info = info;
	}

	if (iconsList.uncategorised.length) {
		result.uncategorized = iconsList.uncategorised;
	}

	// Convert categories
	if (iconsList.tags.length) {
		const categories = (result.categories = Object.create(null) as Record<string, string[]>);
		for (let i = 0; i < iconsList.tags.length; i++) {
			const tag = iconsList.tags[i];
			categories[tag.title] = tag.icons;
		}
	}

	// Hidden icons
	const hidden = Array.from(iconsList.hidden).concat(Object.keys(iconsList.hiddenAliases));
	if (hidden.length) {
		result.hidden = hidden;
	}

	// Add aliases
	const aliases = {
		...iconsList.visibleAliases,
		...iconsList.hiddenAliases,
	};
	for (const alias in aliases) {
		result.aliases = aliases;
		break;
	}

	// Themes
	for (let i = 0; i < themeKeys.length; i++) {
		const key = themeKeys[i] as ThemeKey;
		if (iconSet[key]) {
			result[key as 'themes'] = iconSet[key as 'themes'];
		}
	}

	return result;
}
