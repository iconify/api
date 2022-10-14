import { readFile } from 'node:fs/promises';
import { quicklyValidateIconSet } from '@iconify/utils/lib/icon-set/validate-basic';
import { asyncStoreLoadedIconSet } from '../../data/icon-set/store/storage';
import type { StoredIconSet } from '../../types/icon-set/storage';
import { prependSlash } from '../../misc/files';

export interface IconSetJSONPackageOptions {
	// Ignore bad prefix?
	ignoreInvalidPrefix?: boolean;
}

/**
 * Reusable function for importing icon set from `@iconify-json/*` package
 */
export async function importIconSetFromJSONPackage(
	prefix: string,
	path: string,
	options: IconSetJSONPackageOptions = {}
): Promise<StoredIconSet | undefined> {
	try {
		const data = quicklyValidateIconSet(JSON.parse(await readFile(path + '/icons.json', 'utf8')));
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

		const result = await asyncStoreLoadedIconSet(data);

		// Check for info
		if (!result.info) {
			try {
				const info = JSON.parse(await readFile(path + '/info.json', 'utf8'));
				if (info.prefix === prefix) {
					result.info = info;
				}
			} catch {
				//
			}
		}

		// TODO: handle metadata from other .json files
		return result;
	} catch (err) {
		console.error(err);
	}
}
