import { readFile } from 'node:fs/promises';
import { quicklyValidateIconSet } from '@iconify/utils/lib/icon-set/validate-basic';
import { asyncStoreLoadedIconSet } from '../../data/icon-set/store/storage.js';
import type { StoredIconSet } from '../../types/icon-set/storage.js';
import { appConfig } from '../../config/app.js';

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

		// Check for characters map
		try {
			const chars = JSON.parse(await readFile(path + '/chars.json', 'utf8'));
			if (typeof chars === 'object') {
				for (const key in chars) {
					data.chars = chars;
					break;
				}
			}
		} catch {
			//
		}

		// Check for data needed for icons list
		if (appConfig.enableIconLists) {
			// Info
			try {
				const info = JSON.parse(await readFile(path + '/info.json', 'utf8'));
				if (info.prefix === prefix) {
					data.info = info;
				}
			} catch {
				//
			}

			// Categories, themes
			try {
				const metadata = JSON.parse(await readFile(path + '/metadata.json', 'utf8'));
				if (typeof metadata === 'object') {
					Object.assign(data, metadata);
				}
			} catch {
				//
			}
		}

		const result = await asyncStoreLoadedIconSet(data);

		return result;
	} catch (err) {
		console.error(err);
	}
}
