import { matchIconName } from '@iconify/utils/lib/icon/name';
import { paramToBoolean } from '../../misc/bool.js';
import type { IconStyle } from '../../types/icon-set/extra.js';
import type { SearchKeywords, SearchKeywordsEntry } from '../../types/search.js';
import { minPartialKeywordLength } from './partial.js';

interface SplitOptions {
	// Can include prefix
	prefix: boolean;

	// Can be partial
	partial: boolean;
}

interface SplitResultItem {
	// Icon set prefix
	prefix?: string;

	// List of exact matches
	keywords: string[];

	// Strings to test icon name
	test?: string[];

	// Partial keyword. It is last chunk of last keyword, which cannot be treated as prefix
	partial?: string;
}

type SplitResult = SplitResultItem[];

export function splitKeywordEntries(values: string[], options: SplitOptions): SplitResult | undefined {
	const results: SplitResult = [];
	let invalid = false;

	// Split each entry into arrays
	interface Entry {
		value: string;
		empty: boolean;
	}
	const splitValues: Entry[][] = [];
	values.forEach((item) => {
		const entries: Entry[] = [];
		let hasValue = false;

		const parts = item.split('-');
		for (let i = 0; i < parts.length; i++) {
			const value = parts[i];
			const empty = !value;
			if (!empty && !matchIconName.test(value)) {
				// Invalid entry
				invalid = true;
				return;
			}

			entries.push({
				value,
				empty,
			});
			hasValue = hasValue || !empty;
		}

		splitValues.push(entries);
		if (!hasValue) {
			invalid = true;
		}
	});
	if (invalid || !splitValues.length) {
		// Something went wrong
		return;
	}

	// Convert value to test string, returns undefined if it is a simple keyword
	function valuesToString(items: Entry[]): string | undefined {
		if (!items.length || (items.length === 1 && !items[0].empty)) {
			// Empty or only one keyword
			return;
		}
		return (items[0].empty ? '-' : '') + items.map((item) => item.value).join('-');
	}

	interface ResultsSet {
		keywords: Set<string>;
		test: Set<string>;
		partial?: string;
	}

	// Function to add item
	function addToSet(items: Entry[], set: ResultsSet, allowPartial: boolean) {
		let partial: string | undefined;

		// Add keywords
		const max = items.length - 1;
		for (let i = 0; i <= max; i++) {
			const value = items[i];
			if (!value.empty) {
				if (i === max && allowPartial && value.value.length >= minPartialKeywordLength) {
					partial = value.value;
				} else {
					set.keywords.add(value.value);
				}
			}
		}

		// Get test value
		const testValue = valuesToString(items);
		if (testValue) {
			set.test.add(testValue);
		}

		// Add partial
		if (allowPartial && partial) {
			if (set.partial && set.partial !== partial) {
				console.error('Different partial keywords. This should not be happening!');
			}
			set.partial = partial;
		}
	}

	// Add results set to result
	function addToResult(set: ResultsSet, prefix?: string) {
		if (set.keywords.size || set.partial) {
			const item: SplitResultItem = {
				keywords: Array.from(set.keywords),
				prefix,
				partial: set.partial,
			};
			if (set.test.size) {
				item.test = Array.from(set.test);
			}
			results.push(item);
		}
	}

	// Add items
	const lastIndex = splitValues.length - 1;
	if (options.prefix) {
		const firstItem = splitValues[0];
		const maxFirstItemIndex = firstItem.length - 1;

		// Add with first keyword as prefix
		if (lastIndex) {
			// Check for empty item. It can only be present at the end of value
			const emptyItem = firstItem.find((item) => item.empty);
			if (!emptyItem || (maxFirstItemIndex > 0 && emptyItem === firstItem[maxFirstItemIndex])) {
				const prefix = firstItem.length > 1 ? valuesToString(firstItem) : firstItem[0].value;
				if (prefix) {
					// Valid prefix
					const set: ResultsSet = {
						keywords: new Set(),
						test: new Set(),
					};
					for (let i = 1; i <= lastIndex; i++) {
						addToSet(splitValues[i], set, options.partial && i === lastIndex);
					}
					addToResult(set, prefix);
				}
			}
		}

		// Add with first part of first keyword as prefix
		// First 2 items cannot be empty
		if (maxFirstItemIndex && !firstItem[0].empty && !firstItem[1].empty) {
			const modifiedFirstItem = firstItem.slice(0);
			const prefix = modifiedFirstItem.shift()!.value;
			const set: ResultsSet = {
				keywords: new Set(),
				test: new Set(),
			};
			for (let i = 0; i <= lastIndex; i++) {
				addToSet(i ? splitValues[i] : modifiedFirstItem, set, options.partial && i === lastIndex);
			}
			addToResult(set, prefix);
		}
	}

	// Add as is
	const set: ResultsSet = {
		keywords: new Set(),
		test: new Set(),
	};
	for (let i = 0; i <= lastIndex; i++) {
		addToSet(splitValues[i], set, options.partial && i === lastIndex);
	}
	addToResult(set);

	// Merge values
	if (splitValues.length > 1) {
		// Check which items can be used for merge
		// Merge only simple keywords
		const validIndexes: Set<number> = new Set();
		for (let i = 0; i <= lastIndex; i++) {
			const item = splitValues[i];
			if (item.length === 1 && !item[0].empty) {
				validIndexes.add(i);
			}
		}

		if (validIndexes.size > 1) {
			for (let startIndex = 0; startIndex < lastIndex; startIndex++) {
				if (!validIndexes.has(startIndex)) {
					continue;
				}
				for (let endIndex = startIndex + 1; endIndex <= lastIndex; endIndex++) {
					if (!validIndexes.has(endIndex)) {
						// Break loop
						break;
					}

					// Generate new values list
					const newSplitValues: Entry[][] = [
						...splitValues.slice(0, startIndex),
						[
							{
								value: splitValues
									.slice(startIndex, endIndex + 1)
									.map((item) => item[0].value)
									.join(''),
								empty: false,
							},
						],
						...splitValues.slice(endIndex + 1),
					];
					const newLastIndex = newSplitValues.length - 1;
					const set: ResultsSet = {
						keywords: new Set(),
						test: new Set(),
					};
					for (let i = 0; i <= newLastIndex; i++) {
						addToSet(newSplitValues[i], set, options.partial && i === newLastIndex);
					}
					addToResult(set);
				}
			}
		}
	}

	return results;
}

/**
 * Handle partial prefix
 */
function addPartialPrefix(prefix: string, set: Set<string>): boolean {
	if (prefix.slice(-1) === '*') {
		// Wildcard entry
		prefix = prefix.slice(0, prefix.length - 1);
		if (matchIconName.test(prefix)) {
			set.add(prefix);
			set.add(prefix + '-');
			return true;
		}
	} else if (prefix.length && matchIconName.test(prefix + 'a')) {
		// Add 'a' to allow partial prefixes like 'mdi-'
		set.add(prefix);
		return true;
	}

	return false;
}

/**
 * Split keyword
 */
export function splitKeyword(keyword: string, allowPartial = true): SearchKeywords | undefined {
	const commonPrefixes: Set<string> = new Set();
	let palette: boolean | undefined;
	let iconStyle: IconStyle | undefined;

	// Split by space, check for prefixes and reserved keywords
	const keywordChunks = keyword.toLowerCase().trim().split(/\s+/);
	const keywords: string[] = [];
	let hasPrefixes = false;
	let checkPartial = false;
	for (let i = 0; i < keywordChunks.length; i++) {
		const part = keywordChunks[i];
		const prefixChunks = part.split(':') as string[];

		if (prefixChunks.length > 2) {
			// Too many prefixes: invalidate search query
			return;
		}

		// Check for prefix or reserved keyword
		if (prefixChunks.length === 2) {
			const keyword = prefixChunks[0];
			const value = prefixChunks[1];
			let isKeyword = false;
			switch (keyword) {
				case 'palette': {
					palette = paramToBoolean(value);
					if (typeof palette === 'boolean') {
						isKeyword = true;
					}
					break;
				}

				// style:fill, style:stroke
				case 'style': {
					if (value === 'fill' || value === 'stroke') {
						iconStyle = value;
						isKeyword = true;
					}
					break;
				}

				// fill:true, stroke:true
				case 'fill':
				case 'stroke': {
					if (paramToBoolean(value)) {
						iconStyle = keyword;
						isKeyword = true;
					}
					break;
				}

				case 'prefix':
				case 'prefixes': {
					// Prefixes
					if (hasPrefixes) {
						// Already had entry with prefix: invalidate query
						return;
					}

					const values = value.split(',');
					let invalid = true;
					hasPrefixes = true;
					for (let j = 0; j < values.length; j++) {
						if (addPartialPrefix(values[j].trim(), commonPrefixes)) {
							invalid = false;
						}
					}

					if (invalid) {
						// All prefixes are bad: invalidate search query
						return;
					}

					isKeyword = true;
					break;
				}
			}

			if (!isKeyword) {
				// Icon with prefix
				if (hasPrefixes) {
					// Already had entry with prefix: invalidate query
					return;
				}

				const values = keyword.split(',');
				let invalid = true;
				hasPrefixes = true;
				for (let j = 0; j < values.length; j++) {
					const prefix = values[j].trim();
					if (matchIconName.test(prefix)) {
						commonPrefixes.add(prefix);
						invalid = false;
					}
				}

				if (invalid) {
					// All prefixes are bad: invalidate search query
					return;
				}

				if (value.length) {
					// Add icon name, unless it is empty: 'mdi:'
					// Allow partial if enabled
					checkPartial = allowPartial;
					keywords.push(value);
				}
			}
			continue;
		}

		// 1 part
		// Check for 'key=value' pairs
		const paramChunks = part.split('=');
		if (paramChunks.length > 2) {
			// Bad query
			return;
		}

		if (paramChunks.length === 2) {
			const keyword = paramChunks[0];
			const value = paramChunks[1] as string;
			switch (keyword) {
				// 'palette=true', 'palette=false' -> filter icon sets by palette
				case 'palette':
					palette = paramToBoolean(value);
					if (typeof palette !== 'boolean') {
						return;
					}
					break;

				// style=fill, style=stroke
				case 'style': {
					if (value === 'fill' || value === 'stroke') {
						iconStyle = value;
					} else {
						return;
					}
					break;
				}

				// fill=true, stroke=true
				// accepts only true as value
				case 'fill':
				case 'stroke': {
					if (paramToBoolean(value)) {
						iconStyle = keyword;
					} else {
						return;
					}
					break;
				}

				// 'prefix=material-symbols', 'prefix=material-'
				// 'prefixes=material-symbols,material-'
				case 'prefix':
				case 'prefixes':
					if (hasPrefixes) {
						// Already had entry with prefix: invalidate query
						return;
					}

					let invalid = true;
					const values = value.split(',');
					for (let j = 0; j < values.length; j++) {
						if (addPartialPrefix(values[j].trim(), commonPrefixes)) {
							invalid = false;
						}
					}

					if (invalid) {
						// All prefixes are bad: invalidate search query
						return;
					}
					break;

				default: {
					// Unknown keyword
					return;
				}
			}
			continue;
		}

		// Simple keyword. Allow partial if enabled
		checkPartial = allowPartial;
		keywords.push(part);
	}

	if (!keywords.length) {
		// No keywords
		return;
	}

	const entries = splitKeywordEntries(keywords, {
		prefix: !hasPrefixes && !commonPrefixes.size,
		partial: checkPartial,
	});
	if (!entries) {
		return;
	}

	const searches: SearchKeywordsEntry[] = entries.map((item) => {
		return {
			...item,
			prefixes: item.prefix
				? [...commonPrefixes, item.prefix]
				: commonPrefixes.size
				? [...commonPrefixes]
				: undefined,
		};
	});

	const params: SearchKeywords['params'] = {};
	if (typeof palette === 'boolean') {
		params.palette = palette;
	}
	if (iconStyle) {
		params.style = iconStyle;
	}
	return {
		searches,
		params,
	};
}
