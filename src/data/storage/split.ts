import type { SplitDataTree, SplitRecord, SplitRecordCallback } from '../../types/split.js';

/**
 * Split records into `count` chunks
 *
 * Calls `callback` for each chunk, which should call `next` param to continue splitting.
 * This is done to store data in cache in small chunks when splitting large icon
 * set, allowing memory to be collected after each chunk
 *
 * Calls `done` when done
 */
export function splitRecords<T>(
	data: Record<string, T>,
	numChunks: number,
	callback: SplitRecordCallback<Record<string, T>>,
	done: () => void
) {
	const keys = Object.keys(data).sort((a, b) => a.localeCompare(b));

	const total = keys.length;
	let start = 0;
	let index = 0;

	const next = () => {
		if (index === numChunks) {
			// Done
			done();
			return;
		}

		const end = index === numChunks - 1 ? total : Math.round((total * (index + 1)) / numChunks);
		const keywords = keys.slice(start, end);

		// Copy data
		const itemData = Object.create(null) as typeof data;
		for (let j = 0; j < keywords.length; j++) {
			const keyword = keywords[j];
			itemData[keyword] = data[keyword];
		}

		const item: SplitRecord<Record<string, T>> = {
			keyword: keywords[0],
			data: itemData,
		};

		start = end;
		index++;

		// Call callback
		callback(item, next, index - 1, numChunks);
	};
	next();
}

/**
 * Create tree for searching split records list
 */
export function createSplitRecordsTree<T>(items: SplitRecord<T>[]): SplitDataTree<T> {
	const length = items.length;
	const midIndex = Math.floor(length / 2);
	const midItem = items[midIndex];
	const keyword = midItem.keyword;

	// Check if item can be split
	const hasNext = length > midIndex + 1;
	if (!midIndex && !hasNext) {
		// Not split
		return {
			split: false,
			match: midItem.data,
		};
	}

	// Add keyword and current item
	const tree: SplitDataTree<T> = {
		split: true,
		keyword,
		match: midItem.data,
	};

	// Add previous items
	if (midIndex) {
		tree.prev = createSplitRecordsTree(items.slice(0, midIndex));
	}

	// Next items
	if (hasNext) {
		tree.next = createSplitRecordsTree(items.slice(midIndex));
	}

	return tree;
}

/**
 * Find item
 */
export function searchSplitRecordsTree<T>(tree: SplitDataTree<T>, keyword: string): T {
	if (!tree.split) {
		return tree.match;
	}

	const match = keyword.localeCompare(tree.keyword);
	if (match < 0) {
		return tree.prev ? searchSplitRecordsTree(tree.prev, keyword) : tree.match;
	}
	return match > 0 && tree.next ? searchSplitRecordsTree(tree.next, keyword) : tree.match;
}

/**
 * Find multiple items
 */
export function searchSplitRecordsTreeForSet<T>(tree: SplitDataTree<T>, keywords: string[]): Map<T, string[]> {
	const map: Map<T, string[]> = new Map();

	function search(tree: SplitDataTree<T>, keywords: string[]) {
		if (!tree.split) {
			// Not split
			map.set(tree.match, keywords.concat(map.get(tree.match) || []));
			return;
		}

		const prev: string[] = [];
		const next: string[] = [];
		const matches: string[] = [];

		for (let i = 0; i < keywords.length; i++) {
			const keyword = keywords[i];
			const match = keyword.localeCompare(tree.keyword);
			if (match < 0) {
				(tree.prev ? prev : matches).push(keyword);
			} else {
				(match > 0 && tree.next ? next : matches).push(keyword);
			}
		}

		if (tree.prev && prev.length) {
			search(tree.prev, prev);
		}
		if (tree.next && next.length) {
			search(tree.next, next);
		}
		if (matches.length) {
			map.set(tree.match, matches.concat(map.get(tree.match) || []));
		}
	}
	search(tree, keywords);

	return map;
}
