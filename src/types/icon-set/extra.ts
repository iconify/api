import type { IconifyInfo } from '@iconify/types';

/**
 * Icon style
 */
export type IconStyle = 'fill' | 'stroke';

/**
 * Extra props added to icons
 */
export interface ExtraIconSetIconNamesProps {
	// Icon style
	_is?: IconStyle;

	// Name length without prefix
	_l?: number;
}

/**
 * Icon. First entry is main name, other entries are aliases
 */
export type IconSetIconNames = [string, ...string[]] & ExtraIconSetIconNamesProps;

/**
 * Tag
 */
export interface IconSetIconsListTag {
	// Title
	title: string;

	// Icons
	icons: IconSetIconNames[];
}

/**
 * Icons
 */
export interface IconSetIconsListIcons {
	// Number of visible icons
	total: number;

	// Visible icons
	visible: Record<string, IconSetIconNames>;

	// Hidden icons
	hidden: Record<string, IconSetIconNames>;

	// Failed aliases
	failed: Set<string>;

	// Tags, set if icons list is enabled
	tags?: IconSetIconsListTag[];
	uncategorised?: IconSetIconNames[];

	// Characters, key = character, value = icon
	chars?: Record<string, IconSetIconNames>;

	// Keywords, set if search engine is enabled
	keywords?: Record<string, Set<IconSetIconNames>>;

	// Extra info
	iconStyle?: IconStyle | 'mixed';
}

/**
 * Prepared icons list for API v2 response
 */
export interface IconSetAPIv2IconsList {
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

	// Characters, key = character, value = icon name
	chars?: Record<string, string>;
}

/**
 * Extra data generated for each icon set
 */
export interface IconSetExtraData {
	v2list: IconSetAPIv2IconsList;
}
