import { readFile } from 'node:fs/promises';
import { quicklyValidateIconSet } from '@iconify/utils/lib/icon-set/validate-basic';
import { asyncStoreLoadedIconSet } from '../../data/icon-set/store/storage';
import type { StoredIconSet } from '../../types/icon-set/storage';
import { prependSlash } from '../../misc/files';

export interface IconSetJSONOptions {
	// Ignore bad prefix?
	ignoreInvalidPrefix?: boolean;
}

/**
 * Reusable function for importing icon set from JSON file
 */
export async function importIconSetFromJSON(
	prefix: string,
	path: string,
	filename: string,
	options: IconSetJSONOptions = {}
): Promise<StoredIconSet | undefined> {
	try {
		const data = quicklyValidateIconSet(JSON.parse(await readFile(path + prependSlash(filename), 'utf8')));
		if (!data) {
			console.error(`Error loading "${prefix}" icon set: failed to validate`);
			return;
		}
		if (data.prefix !== prefix) {
			if (!options.ignoreInvalidPrefix) {
				console.error(
					`Error loading "${prefix}" icon set: bad prefix (enable ignoreInvalidPrefix option in importer to skip this check)`
				);
				return;
			}
			data.prefix = prefix;
		}

		// TODO: handle metadata from raw icon set data
		return await asyncStoreLoadedIconSet(data);
	} catch (err) {
		console.error(err);
	}
}
