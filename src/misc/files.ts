import { stat } from 'node:fs/promises';
import { scanDirectory } from '@iconify/tools/lib/misc/scan';
import type { FileEntry } from '../types/files.js';
import { hashString } from './hash.js';

/**
 * List all files in directory
 */
export async function listFilesInDirectory(path: string): Promise<FileEntry[]> {
	const files = await scanDirectory(path, (ext, file, subdir, path, stat) => {
		const filename = subdir + file + ext;

		const item: FileEntry = {
			filename,
			ext,
			file,
			path: subdir,
			mtime: stat.mtimeMs,
			size: stat.size,
		};
		return item;
	});
	files.sort((a, b) => a.filename.localeCompare(b.filename));
	return files;
}

/**
 * Hash files to quickly check if files were changed
 *
 * Does not check file contents, checking last modification time should be enough
 */
export function hashFiles(files: FileEntry[]): string {
	const hashData = files.map(({ filename, mtime, size }) => {
		return { filename, mtime, size };
	});
	return hashString(JSON.stringify(hashData));
}

/**
 * Check if directory exists
 */
export async function directoryExists(dir: string): Promise<boolean> {
	try {
		const stats = await stat(dir);
		return stats.isDirectory();
	} catch {
		return false;
	}
}

/**
 * Add '/' to start of filename
 */
export function prependSlash(filename: string): string {
	return filename.slice(0, 1) === '/' ? filename : '/' + filename;
}
