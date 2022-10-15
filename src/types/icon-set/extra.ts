import type { IconifyInfo, IconifyJSON } from '@iconify/types';

/**
 * Tag
 */
export interface IconSetIconsListTag {
	// Title
	title: string;

	// Names of icons
	icons: string[];
}

/**
 * Icons
 */
export interface IconSetIconsListIcons {
	// Visible icons
	visible: Set<string>;

	// Hidden icons
	hidden: Set<string>;

	// Aliases, pointing to parent icon in either `visible` or `hidden` set
	visibleAliases: Record<string, string>;
	hiddenAliases: Record<string, string>;

	// Failed aliases
	failed: Set<string>;

	// Tags
	tags: IconSetIconsListTag[];
	uncategorised: string[];
}

/**
 * Prepared icons list for API v2 response
 */
export interface IconSetAPIv2IconsList {
	// Prepared data
	rendered: {
		// Icon set prefix
		prefix: string;

		// Number of icons (duplicate of info?.total)
		total: number;

		// Icon set title, if available (duplicate of info?.name)
		title?: string;

		// Icon set info
		info?: IconifyInfo;

		// List of icons without categories
		uncategorized?: string[];

		// List of icons, sorted by category
		categories?: Record<string, string[]>;

		// List of hidden icons
		hidden?: string[];

		// List of aliases, key = alias, value = parent icon
		aliases?: Record<string, string>;

		// Themes
		themes?: IconifyJSON['themes'];
		prefixes?: IconifyJSON['prefixes'];
		suffixes?: IconifyJSON['suffixes'];
	};

	// Characters, key = character, value = icon name
	chars?: Record<string, string>;
}

/**
 * Extra data generated for each icon set
 */
export interface IconSetExtraData {
	v2list: IconSetAPIv2IconsList;
}
