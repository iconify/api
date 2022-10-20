import type { FastifyReply, FastifyRequest } from 'fastify';
import { getPrefixes, iconSets } from '../../data/icon-sets';
import type { IconSetAPIv2IconsList } from '../../types/icon-set/extra';
import type { StoredIconSet } from '../../types/icon-set/storage';
import type {
	APIv1ListIconsBaseResponse,
	APIv1ListIconsCategorisedResponse,
	APIv1ListIconsResponse,
} from '../../types/server/v1';
import { checkJSONPQuery, sendJSONResponse } from '../helpers/json';
import { filterPrefixesByPrefix } from '../helpers/prefixes';

/**
 * Send API v2 response
 *
 * This response ignores the following parameters:
 * - `aliases` -> always enabled
 * - `hidden` -> always enabled
 *
 * Those parameters are always requested anyway, so does not make sense to re-create data in case they are disabled
 */
export function generateAPIv1IconsListResponse(
	query: FastifyRequest['query'],
	res: FastifyReply,
	categorised: boolean
) {
	const q = (query || {}) as Record<string, string>;

	const wrap = checkJSONPQuery(q);
	if (!wrap) {
		// Invalid JSONP callback
		res.send(400);
		return;
	}

	function parse(
		prefix: string,
		iconSet: StoredIconSet,
		v2Cache: IconSetAPIv2IconsList
	): APIv1ListIconsResponse | APIv1ListIconsCategorisedResponse {
		const icons = iconSet.icons;

		// Generate common data
		const base: APIv1ListIconsBaseResponse = {
			prefix,
			total: v2Cache.total,
		};
		if (v2Cache.title) {
			base.title = v2Cache.title;
		}
		if (q.info && v2Cache.info) {
			base.info = v2Cache.info;
		}
		if (q.aliases && v2Cache.aliases) {
			base.aliases = v2Cache.aliases;
		}
		if (q.chars && v2Cache.chars) {
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

	if (q.prefix) {
		const prefix = q.prefix;
		const iconSet = iconSets[prefix]?.item;
		if (!iconSet || !iconSet.apiV2IconsCache) {
			res.send(404);
			return;
		}
		sendJSONResponse(parse(prefix, iconSet, iconSet.apiV2IconsCache), q, wrap, res);
		return;
	}

	if (q.prefixes) {
		const prefixes = filterPrefixesByPrefix(
			getPrefixes(),
			{
				prefixes: q.prefixes,
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
			res.send(404);
			return;
		}

		// Get all items
		const result = Object.create(null) as Record<string, ReturnType<typeof parse>>;
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			result[item.prefix] = parse(item.prefix, item.iconSet, item.v2Cache);
		}
		sendJSONResponse(result, q, wrap, res);
		return;
	}

	// Invalid
	res.send(400);
}
