import type { IconifyAliases, IconifyJSON, IconifyOptional } from '@iconify/types';
import { defaultIconProps } from '@iconify/utils/lib/icon/defaults';
import type { IconSetIconsListIcons, IconSetIconsListTag } from '../../../types/icon-set/extra';

const customisableProps = Object.keys(defaultIconProps) as (keyof IconifyOptional)[];

/**
 * Generate icons tree
 */
export function generateIconSetIconsTree(iconSet: IconifyJSON): IconSetIconsListIcons {
	const iconSetIcons = iconSet.icons;
	const iconSetAliases = iconSet.aliases || (Object.create(null) as IconifyAliases);

	const checked: Set<string> = new Set();
	const visible: Set<string> = new Set();
	const hidden: Set<string> = new Set();
	const failed: Set<string> = new Set();
	const visibleAliases = Object.create(null) as Record<string, string>;
	const hiddenAliases = Object.create(null) as Record<string, string>;

	// Generate list of tags for each icon
	const tags: IconSetIconsListTag[] = [];
	const uncategorised: string[] = [];

	const resolvedTags = Object.create(null) as Record<string, Set<IconSetIconsListTag>>;
	const categories = iconSet.categories;
	if (categories) {
		for (const title in categories) {
			const items = categories[title];
			if (items instanceof Array) {
				const tag: IconSetIconsListTag = {
					title,
					icons: [],
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
		(isVisible ? visible : hidden).add(name);
		checked.add(name);

		if (isVisible) {
			// Check tag
			const iconTags = resolvedTags[name];
			if (iconTags) {
				// Add icon to each tag
				iconTags.forEach((tag) => {
					tag.icons.push(name);
				});
			} else {
				// No tags: uncategorised
				uncategorised.push(name);
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

		// Success
		const isVisible =
			item.hidden === false || (!item.hidden && (visible.has(parent) || visibleAliases[parent] !== void 0));
		failed.delete(name);

		// Add tags
		let itemTags: Set<IconSetIconsListTag> | undefined = resolvedTags[name];
		if (!itemTags) {
			// Use tags from parent icon
			itemTags = resolvedTags[name] = resolvedTags[parent];
		}

		if (isVisible && transformed) {
			// Icon: add to tags
			if (itemTags) {
				itemTags.forEach((tag) => {
					tag.icons.push(name);
				});
			} else {
				uncategorised.push(name);
			}
		}

		// Add icon
		if (transformed) {
			// Treat as new icon
			(isVisible ? visible : hidden).add(name);
		} else {
			// Treat as alias
			const parentName = visibleAliases[parent] || hiddenAliases[parent] || parent;
			(isVisible ? visibleAliases : hiddenAliases)[name] = parentName;
		}
	};

	for (const name in iconSetAliases) {
		resolve(name);
	}

	// Sort icons in tags
	for (let i = 0; i < tags.length; i++) {
		tags[i].icons.sort((a, b) => a.localeCompare(b));
	}
	uncategorised.sort((a, b) => a.localeCompare(b));

	// Return data
	return {
		visible,
		hidden,
		visibleAliases,
		hiddenAliases,
		failed,
		tags: tags.filter((tag) => tag.icons.length > 0),
		uncategorised,
	};
}
