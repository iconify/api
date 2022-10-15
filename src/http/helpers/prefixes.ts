interface MatchPrefixesParams {
	// One prefix
	prefix?: string;

	// Comma separated prefixes
	prefixes?: string;
}

/**
 * Filter prefixes by name
 *
 * returnEmpty = true -> if no filter params set, returns empty array
 * returnEmpty = false -> if no filter params set, returns all filters
 */
export function filterPrefixesByPrefix(
	prefixes: string[],
	params: MatchPrefixesParams,
	returnEmpty: boolean
): string[] {
	const exactMatch = params.prefix;
	if (exactMatch) {
		// Exact match
		return prefixes.indexOf(exactMatch) === -1 ? [] : [exactMatch];
	}

	const partialMatch = params.prefixes;
	if (partialMatch) {
		// Split matches by partial and full
		const exact: Set<string> = new Set();
		const partial: string[] = [];

		partialMatch.split(',').forEach((prefix) => {
			if (prefix.slice(-1) === '-') {
				// Partial prefix: 'mdi-'
				partial.push(prefix);
			} else {
				// Exact match
				exact.add(prefix);
			}
		});

		// Filter prefixes
		return prefixes.filter((prefix) => {
			if (exact.has(prefix)) {
				return true;
			}
			for (let i = 0; i < partial.length; i++) {
				const match = partial[i];
				if (prefix.slice(0, match.length) === match) {
					return true;
				}
			}
			return false;
		});
	}

	// No filters
	return returnEmpty ? [] : prefixes;
}
