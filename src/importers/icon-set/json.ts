import type { BaseDownloader } from '../../downloaders/base.js';
import type { BaseIconSetImporter } from '../../types/importers/icon-set.js';
import type { IconSetImportedData } from '../../types/importers/common.js';
import { IconSetJSONOptions, importIconSetFromJSON } from '../common/icon-set-json.js';

interface JSONIconSetImporterOptions extends IconSetJSONOptions {
	// Icon set prefix
	prefix: string;

	// File to load from
	filename: string;
}

/**
 * Create importer for .json file
 */
export function createJSONIconSetImporter<Downloader extends BaseDownloader<IconSetImportedData>>(
	instance: Downloader,
	options: JSONIconSetImporterOptions
): Downloader & BaseIconSetImporter {
	const obj = instance as Downloader & BaseIconSetImporter;
	const prefix = options.prefix;

	// Set instance properties
	const baseData: BaseIconSetImporter = {
		type: 'icon-set',
		prefix,
	};
	Object.assign(obj, baseData);

	// Load data
	obj._loadDataFromDirectory = (path: string) => importIconSetFromJSON(prefix, path, options.filename, options);

	return obj;
}
