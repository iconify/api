import { RemoteDownloader } from './downloaders/remote';
import { createIconSetsPackageImporter } from './importers/full/json';
import type { RemoteDownloaderOptions } from './types/downloaders/remote';
import type { ImportedData } from './types/importers/common';

(async () => {
	const startMem = (process.memoryUsage && process.memoryUsage().heapUsed) || 0;

	const options: RemoteDownloaderOptions = {
		downloadType: 'npm',
		package: '@iconify/json',
	};
	const importer = createIconSetsPackageImporter(new RemoteDownloader<ImportedData>(options));
	console.log('Importer type:', importer.type);

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

	const endMem = (process.memoryUsage && process.memoryUsage().heapUsed) || 0;

	console.log('Loaded in', Date.now() - start, 'ms');
	console.log('Memory usage:', (endMem - startMem) / 1024 / 1024);
	console.log(iconSetsCount, 'icon sets,', visibleIconSetsCount, 'visible');
	console.log(iconsCount, 'icons,', visibleIconsCount, 'visible)');
})();
