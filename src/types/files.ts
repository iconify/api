/**
 * File
 */
export interface FileEntry {
	// Full filename with path
	filename: string;

	// Extension with dot
	ext: string;

	// File name without path and extension
	file: string;

	// Path, relative to scanned directory
	path: string;

	// Last modification time
	mtime: number;

	// Size
	size: number;
}
