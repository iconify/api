import { readFile } from 'node:fs/promises';
import { quicklyValidateIconSet } from '@iconify/utils/lib/icon-set/validate-basic';
import { asyncStoreLoadedIconSet } from '../../data/icon-set/store/storage.js';
import type { StoredIconSet } from '../../types/icon-set/storage.js';
import { prependSlash } from '../../misc/files.js';

export interface IconSetJSONOptions {
	// Ignore bad prefix?
	// false -> skip icon sets with mismatched prefix
	// true -> import icon set with mismatched prefix
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
				if (options.ignoreInvalidPrefix === void 0) {
					// Show warning if option is not set
					console.error(
						`Error loading "${prefix}" icon set: bad prefix (enable ignoreInvalidPrefix option in importer to import icon set)`
					);
				}
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
