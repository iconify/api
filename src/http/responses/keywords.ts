import { matchIconName } from '@iconify/utils/lib/icon/name';
import { searchIndex } from '../../data/search.js';
import { getPartialKeywords } from '../../data/search/partial.js';
import type { APIv3KeywordsQuery, APIv3KeywordsResponse } from '../../types/server/keywords.js';

/**
 * Find full keywords for partial keyword
 */
export function createKeywordsResponse(q: Record<string, string>): number | APIv3KeywordsResponse {
	// Check if search data is available
	const searchIndexData = searchIndex.data;
	if (!searchIndexData) {
		return 404;
	}
	const keywords = searchIndexData.keywords;

	// Get params
	let test: string;
	let suffixes: boolean;
	let invalid: true | undefined;
	let failed = false;

	if (typeof q.prefix === 'string') {
		// Keywords should start with prefix
		test = q.prefix;
		suffixes = false;
	} else if (typeof q.keyword === 'string') {
		// All keywords that contain keyword
		test = q.keyword;
		suffixes = true;
	} else {
		// Invalid query
		return 400;
	}
	test = test.toLowerCase().trim();

	// Check if keyword is invalid
	if (!matchIconName.test(test)) {
		invalid = true;
	} else {
		// Get only last part of complex keyword
		// Testing complex keywords is not recommended, mix of parts is not checked
		const parts = test.split('-');
		if (parts.length > 1) {
			test = parts.pop() as string;
			suffixes = false;
			for (let i = 0; i < parts.length; i++) {
				if (keywords[parts[i]] === void 0) {
					// One of keywords is missing
					failed = true;
				}
			}
		}
	}

	// Generate result
	const response: APIv3KeywordsResponse = {
		...(q as unknown as APIv3KeywordsQuery),
		invalid,
		exists: failed ? false : keywords[test] !== void 0,
		matches: failed || invalid ? [] : getPartialKeywords(test, suffixes, searchIndexData)?.slice(0) || [],
	};

	return response;
}
