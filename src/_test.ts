import { RemoteDownloader } from './downloaders/remote';
import { createJSONCollectionsListImporter } from './importers/collections/collections';
import { createJSONPackageIconSetImporter } from './importers/icon-set/json-package';
import type { RemoteDownloaderOptions } from './types/downloaders/remote';
import type { IconSetImportedData, ImportedData } from './types/importers/common';

(async () => {
	const options: RemoteDownloaderOptions = {
		downloadType: 'npm',
		package: '@iconify/collections',
	};
	const importer = createJSONCollectionsListImporter(new RemoteDownloader<ImportedData>(options), (prefix) =>
		createJSONPackageIconSetImporter(
			new RemoteDownloader<IconSetImportedData>({
				downloadType: 'npm',
				package: `@iconify-json/${prefix}`,
			}),
			{ prefix }
		)
	);

	const start = Date.now();
	await importer.init();

	const data = importer.data;
	if (!data) {
		throw new Error('Something went wrong!');
	}

	let iconSetsCount = 0;
	let visibleIconSetsCount = 0;
	let iconsCount = 0;
	let visibleIconsCount = 0;
	data.prefixes.forEach((prefix) => {
		const item = data.iconSets[prefix];
		if (!item) {
			console.error(`Failed to load: ${prefix}`);
			return;
		}

		const info = item.info;
		if (!info) {
			console.error(`Missing info in ${prefix}`);
			return;
		}

		iconSetsCount++;
		iconsCount += info.total || 0;
		if (!info.hidden) {
			visibleIconSetsCount++;
			visibleIconsCount += info.total || 0;
		}
	});

	console.log('Loaded in', Date.now() - start, 'ms');
	console.log(iconSetsCount, 'icon sets,', visibleIconSetsCount, 'visible');
	console.log(iconsCount, 'icons,', visibleIconsCount, 'visible)');
})();
