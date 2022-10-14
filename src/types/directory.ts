/**
 * Entry for file
 */
export interface ImportDirectoryFileEntry {
	// Path to scanned directory, ends with '/'
	path: string;
	// Sub-directory, ends with '/' (can be empty)
	subdir: string;
	// Filename without extension
	file: string;
	// Extension, starts with '.' (can be empty)
	ext: string;
}
