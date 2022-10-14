import { RemoteDownloader } from '../../lib/downloaders/remote';
import { DirectoryDownloader } from '../../lib/downloaders/directory';
import { createJSONIconSetImporter } from '../../lib/importers/icon-set/json';
import { createJSONPackageIconSetImporter } from '../../lib/importers/icon-set/json-package';
import type { StoredIconSet } from '../../lib/types/icon-set/storage';

describe('Icon set IconifyJSON importer', () => {
	test('Import from NPM, nothing to update', async () => {
		// Create downloader and importer
		const downloader = new RemoteDownloader<StoredIconSet>({
			downloadType: 'npm',
			package: '@iconify-json/topcoat',
		});
		const importer = createJSONPackageIconSetImporter(downloader, {
			prefix: 'topcoat',
		});

		let iconSet: StoredIconSet | undefined;
		let updateCounter = 0;

		// Add callback
		expect(importer._dataUpdated).toBeUndefined();
		importer._dataUpdated = async (data) => {
			updateCounter++;
			iconSet = data;
		};

		// Init
		expect(await importer.init()).toBe(true);
		expect(iconSet).toBeDefined();
		expect(updateCounter).toBe(1);

		// Info should be set
		expect(iconSet?.info?.name).toBe('TopCoat Icons');

		// Check for update
		expect(await importer.checkForUpdate()).toBe(false);
		expect(updateCounter).toBe(1);
	}, 5000);

	test('Import from JSON file', async () => {
		// Create downloader and importer
		const downloader = new DirectoryDownloader<StoredIconSet>('tests/fixtures/json');
		const importer = createJSONIconSetImporter(downloader, {
			prefix: 'mdi-light',
			filename: '/mdi-light.json',
		});

		let iconSet: StoredIconSet | undefined;
		let updateCounter = 0;

		// Add callback
		expect(importer._dataUpdated).toBeUndefined();
		importer._dataUpdated = async (data) => {
			updateCounter++;
			iconSet = data;
		};

		// Init
		expect(await importer.init()).toBe(true);
		expect(iconSet).toBeDefined();
		expect(updateCounter).toBe(1);

		// Info should be set
		expect(iconSet?.info?.name).toBe('Material Design Light');

		// Check for update
		expect(await importer.checkForUpdate()).toBe(false);
		expect(updateCounter).toBe(1);
	}, 5000);
});
