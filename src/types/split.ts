/**
 * Split records
 */
export interface SplitRecord<T> {
	// Keyword for item
	keyword: string;

	// Data
	data: T;
}

/**
 * Callback to call to store record
 */
export type SplitRecordCallback<T> = (data: SplitRecord<T>, next: () => void, index: number, total: number) => void;

/**
 * Tree for searching records
 */
interface SplitDataTreeBase<T> {
	// Status
	split: boolean;

	// Matching item
	match: T;
}

// Type for item that has no children
interface SplitDataTreeNotSplit<T> extends SplitDataTreeBase<T> {
	split: false;
}

// Type for item that has children
interface SplitDataTreeSplit<T> extends SplitDataTreeBase<T> {
	split: true;

	// Keyword to test
	keyword: string;

	// Previous items to search if localeCompare returns < 0
	prev?: SplitDataTree<T>;

	// Next items to search if localeCompare return > 0
	next?: SplitDataTree<T>;
}

export type SplitDataTree<T> = SplitDataTreeNotSplit<T> | SplitDataTreeSplit<T>;
