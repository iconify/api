import { getPrefixes, iconSets } from '../../data/icon-sets.js';
import type { IconSetAPIv2IconsList } from '../../types/icon-set/extra.js';
import type { StoredIconSet } from '../../types/icon-set/storage.js';
import type {
	APIv1ListIconsBaseResponse,
	APIv1ListIconsCategorisedResponse,
	APIv1ListIconsResponse,
} from '../../types/server/v1.js';
import { filterPrefixesByPrefix } from '../helpers/prefixes.js';

// Response results, depends on `categorised` option
type PossibleResults = APIv1ListIconsResponse | APIv1ListIconsCategorisedResponse;

/**
 * Create API v1 response
 *
 * This response ignores the following parameters:
 * - `aliases` -> always enabled
 * - `hidden` -> always enabled
 *
 * Those parameters are always requested anyway, so does not make sense to re-create data in case they are disabled
 */
export function createAPIv1IconsListResponse(
	query: Record<string, string>,
	categorised: boolean
): PossibleResults | Record<string, PossibleResults> | number {
	function parse(
		prefix: string,
		iconSet: StoredIconSet,
		v2Cache: IconSetAPIv2IconsList
	): APIv1ListIconsResponse | APIv1ListIconsCategorisedResponse {
		// Generate common data
		const base: APIv1ListIconsBaseResponse = {
			prefix,
			total: v2Cache.total,
		};
		if (v2Cache.title) {
			base.title = v2Cache.title;
		}
		if (query.info && v2Cache.info) {
			base.info = v2Cache.info;
		}
		if (query.aliases && v2Cache.aliases) {
			base.aliases = v2Cache.aliases;
		}
		if (query.chars && v2Cache.chars) {
			base.chars = v2Cache.chars;
		}

		// Add icons
		if (categorised) {
			const result = base as APIv1ListIconsCategorisedResponse;
			if (v2Cache.categories) {
				result.categories = v2Cache.categories;
			}
			if (v2Cache.uncategorized) {
				result.uncategorized = v2Cache.uncategorized;
			}
			return result;
		}

		const result = base as APIv1ListIconsResponse;
		result.icons = [];
		const visible = iconSet.icons.visible;
		for (const name in visible) {
			if (visible[name][0] === name) {
				result.icons.push(name);
			}
		}
		return result;
	}

	if (query.prefix) {
		const prefix = query.prefix;
		const iconSet = iconSets[prefix]?.item;
		if (!iconSet || !iconSet.apiV2IconsCache) {
			return 404;
		}
		return parse(prefix, iconSet, iconSet.apiV2IconsCache);
	}

	if (query.prefixes) {
		const prefixes = filterPrefixesByPrefix(
			getPrefixes(),
			{
				prefixes: query.prefixes,
			},
			false
		);

		// Retrieve all items
		interface Item {
			prefix: string;
			iconSet: StoredIconSet;
			v2Cache: IconSetAPIv2IconsList;
		}
		const items: Item[] = [];
		for (let i = 0; i < prefixes.length; i++) {
			const prefix = prefixes[i];
			const iconSet = iconSets[prefix]?.item;
			if (iconSet?.apiV2IconsCache) {
				items.push({
					prefix,
					iconSet,
					v2Cache: iconSet.apiV2IconsCache,
				});
				if (items.length > 10) {
					break;
				}
			}
		}

		if (!items.length) {
			// Empty list
			return 404;
		}

		// Get all items
		const result = Object.create(null) as Record<string, PossibleResults>;
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			result[item.prefix] = parse(item.prefix, item.iconSet, item.v2Cache);
		}
		return result;
	}

	// Invalid
	return 400;
}
