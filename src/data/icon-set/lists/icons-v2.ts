import type { IconifyJSON } from '@iconify/types';
import type { IconSetIconsListIcons, IconSetAPIv2IconsList } from '../../../types/icon-set/extra.js';

/**
 * Prepare data for icons list API v2 response
 */
export function prepareAPIv2IconsList(iconSet: IconifyJSON, iconsList: IconSetIconsListIcons): IconSetAPIv2IconsList {
	const tags = iconsList.tags;
	const uncategorised = iconsList.uncategorised;
	if (!tags || !uncategorised) {
		throw new Error('prepareAPIv2IconsList() was called with missing data');
	}

	// Prepare data
	const result: IconSetAPIv2IconsList = {
		prefix: iconSet.prefix,
		total: iconsList.total,
	};

	const info = iconSet.info;
	if (info) {
		result.title = info.name;
		result.info = info;
	}

	// Icons without categories
	if (uncategorised.length) {
		result.uncategorized = uncategorised.map((item) => item[0]);
	}

	// Categories
	if (tags.length) {
		const categories = (result.categories = Object.create(null) as Record<string, string[]>);
		for (let i = 0; i < tags.length; i++) {
			const tag = tags[i];
			categories[tag.title] = tag.icons.map((icon) => icon[0]);
		}
	}

	// Aliases
	const aliases = Object.create(null) as Record<string, string>;
	for (const name in iconsList.visible) {
		const item = iconsList.visible[name];
		if (item[0] !== name) {
			aliases[name] = item[0];
		}
	}

	// Hidden icons
	const hidden: string[] = [];
	for (const name in iconsList.hidden) {
		const item = iconsList.hidden[name];
		if (item[0] === name) {
			hidden.push(name);
		} else {
			aliases[name] = item[0];
		}
	}

	if (hidden.length) {
		result.hidden = hidden;
	}

	// Aliases
	for (const key in aliases) {
		result.aliases = aliases;
		break;
	}

	if (iconsList.chars) {
		// Add characters map
		const chars = (result.chars = Object.create(null) as Record<string, string>);
		const sourceChars = iconsList.chars;
		for (const key in sourceChars) {
			chars[key] = sourceChars[key][0];
		}
	}

	return result;
}
