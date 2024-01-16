import type { ExtendedIconifyAlias, ExtendedIconifyIcon, IconifyIcons } from '@iconify/types';
import { mergeIconData } from '@iconify/utils/lib/icon/merge';
import type { SplitIconifyJSONMainData } from '../../../types/icon-set/split.js';
import type { StoredIconSet } from '../../../types/icon-set/storage.js';
import { searchSplitRecordsTree } from '../../storage/split.js';
import { getStoredItem } from '../../storage/get.js';

interface PrepareResult {
	// Merged properties
	props: ExtendedIconifyIcon | ExtendedIconifyAlias;

	// Name of icon to merge with
	name: string;
}

function prepareAlias(data: SplitIconifyJSONMainData, name: string): PrepareResult {
	const aliases = data.aliases;

	// Resolve aliases tree
	let props: ExtendedIconifyIcon | ExtendedIconifyAlias = aliases[name];
	name = props.parent;
	while (true) {
		const alias = aliases[name];
		if (alias) {
			// Another alias
			props = mergeIconData(alias, props);
			name = alias.parent;
		} else {
			// Icon
			return {
				props,
				name,
			};
		}
	}
}

/**
 * Get icon data
 *
 * Assumes that icon exists and valid. Should validate icon set and load data before running this function
 */
export function getIconData(data: SplitIconifyJSONMainData, name: string, icons: IconifyIcons): ExtendedIconifyIcon {
	// Get data
	let props: ExtendedIconifyIcon | ExtendedIconifyAlias;
	if (icons[name]) {
		// Icon: copy as is
		props = icons[name];
	} else {
		// Resolve alias
		const result = prepareAlias(data, name);
		props = mergeIconData(icons[result.name], result.props);
	}

	// Add default values
	return mergeIconData(data, props) as unknown as ExtendedIconifyIcon;
}

/**
 * Get icon data from stored icon set
 */
export function getStoredIconData(
	iconSet: StoredIconSet,
	name: string,
	callback: (data: ExtendedIconifyIcon | null) => void
) {
	const common = iconSet.common;

	// Get data
	let props: ExtendedIconifyIcon | ExtendedIconifyAlias;
	if (common.aliases[name]) {
		const resolved = prepareAlias(common, name);
		props = resolved.props;
		name = resolved.name;
	} else {
		props = {} as ExtendedIconifyAlias;
		const charValue = iconSet.icons.chars?.[name]?.[0];
		if (charValue) {
			// Character
			const icons = iconSet.icons;
			if (!icons.visible[name] && !icons.hidden[name]) {
				// Resolve character instead of alias
				name = charValue;
				if (common.aliases[name]) {
					const resolved = prepareAlias(common, name);
					props = resolved.props;
					name = resolved.name;
				}
			}
		}
	}

	// Load icon
	const chunk = searchSplitRecordsTree(iconSet.tree, name);
	getStoredItem(iconSet.storage, chunk, (data) => {
		if (!data || !data[name]) {
			// Failed
			callback(null);
			return;
		}

		// Merge icon data with aliases
		props = mergeIconData(data[name], props);

		// Add default values
		callback(mergeIconData(common, props) as unknown as ExtendedIconifyIcon);
	});
}
