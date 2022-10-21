import type { IconifyAliases, IconifyJSON, IconifyOptional } from '@iconify/types';
import { defaultIconProps } from '@iconify/utils/lib/icon/defaults';
import { appConfig } from '../../../config/app';
import type { IconSetIconNames, IconSetIconsListIcons, IconSetIconsListTag } from '../../../types/icon-set/extra';

const customisableProps = Object.keys(defaultIconProps) as (keyof IconifyOptional)[];

/**
 * Generate icons tree
 */
export function generateIconSetIconsTree(iconSet: IconifyJSON): IconSetIconsListIcons {
	const iconSetIcons = iconSet.icons;
	const iconSetAliases = iconSet.aliases || (Object.create(null) as IconifyAliases);

	const checked: Set<string> = new Set();
	const visible = Object.create(null) as Record<string, IconSetIconNames>;
	const hidden = Object.create(null) as Record<string, IconSetIconNames>;
	const failed: Set<string> = new Set();
	let total = 0;

	// Generate list of tags for each icon
	const tags: IconSetIconsListTag[] = [];
	const uncategorised: IconSetIconNames[] = [];

	const resolvedTags = Object.create(null) as Record<string, Set<IconSetIconsListTag>>;
	const categories = iconSet.categories;
	if (categories && appConfig.enableIconLists) {
		for (const title in categories) {
			const items = categories[title];
			if (items instanceof Array) {
				const icons: IconSetIconNames[] = [];
				const tag: IconSetIconsListTag = {
					title,
					icons,
				};
				tags.push(tag);
				for (let i = 0; i < items.length; i++) {
					const name = items[i];
					(resolvedTags[name] || (resolvedTags[name] = new Set())).add(tag);
				}
			}
		}
	}

	// Parse all icons
	for (const name in iconSetIcons) {
		const isVisible = !iconSetIcons[name].hidden;
		const icon: IconSetIconNames = [name];
		(isVisible ? visible : hidden)[name] = icon;
		checked.add(name);

		if (isVisible) {
			total++;

			// Check tags
			if (appConfig.enableIconLists) {
				const iconTags = resolvedTags[name];
				if (iconTags) {
					// Add icon to each tag
					iconTags.forEach((tag) => {
						tag.icons.push(icon);
					});
				} else {
					// No tags: uncategorised
					uncategorised.push(icon);
				}
			}
		}
	}

	// Parse all aliases
	const resolve = (name: string) => {
		if (checked.has(name)) {
			// Already checked
			return;
		}
		checked.add(name);

		// Mark as failed to avoid loop, will be removed later on success
		failed.add(name);

		const item = iconSetAliases[name];
		if (!item) {
			// Failed
			return;
		}

		// Get parent
		const parent = item.parent;
		if (!checked.has(parent)) {
			resolve(parent);
		}

		// Get parent
		if (failed.has(parent)) {
			return;
		}

		// Check if item has transformations
		let transformed = false;
		for (let i = 0; i < customisableProps.length; i++) {
			if (item[customisableProps[i]] !== void 0) {
				transformed = true;
				break;
			}
		}

		// Check visibility
		const parentVisible = !!visible[parent];
		let isVisible: boolean;
		if (typeof item.hidden === 'boolean') {
			isVisible = !item.hidden;
		} else {
			// Same visibility as parent icon
			isVisible = parentVisible;
		}

		// Add icon
		const parentIcon = visible[parent] || hidden[parent];
		let icon: IconSetIconNames;
		if (transformed || isVisible !== parentVisible) {
			// Treat as new icon
			icon = [name];
			if (isVisible) {
				total++;

				// Check for categories
				if (appConfig.enableIconLists) {
					const iconTags = resolvedTags[name];
					if (iconTags) {
						// Alias has its own categories!
						iconTags.forEach((tag) => {
							tag.icons.push(icon);
						});
					} else {
						// Copy from parent
						const iconTags = resolvedTags[parentIcon[0]];
						if (iconTags) {
							resolvedTags[name] = iconTags;
							iconTags.forEach((tag) => {
								tag.icons.push(icon);
							});
						} else {
							uncategorised.push(icon);
						}
					}
				}
			}
		} else {
			// Treat as alias: add to parent icon
			icon = parentIcon;
			icon.push(name);
		}
		(isVisible ? visible : hidden)[name] = icon;

		// Success
		failed.delete(name);
	};

	for (const name in iconSetAliases) {
		resolve(name);
	}

	// Create data
	const result: IconSetIconsListIcons = {
		total,
		visible,
		hidden,
		failed,
	};

	// Sort icons in tags
	if (appConfig.enableIconLists) {
		for (let i = 0; i < tags.length; i++) {
			tags[i].icons.sort((a, b) => a[0].localeCompare(b[0]));
		}
		result.tags = tags.filter((tag) => tag.icons.length > 0);
		result.uncategorised = uncategorised.sort((a, b) => a[0].localeCompare(b[0]));
	}

	// Add characters
	if (iconSet.chars) {
		const sourceChars = iconSet.chars;
		const chars = Object.create(null) as Record<string, IconSetIconNames>;
		for (const char in sourceChars) {
			const name = sourceChars[char];
			const item = visible[name] || hidden[name];
			if (item) {
				chars[char] = item;
			}
		}
		result.chars = chars;
	}

	return result;
}
