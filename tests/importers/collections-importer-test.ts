import { DirectoryDownloader } from '../../lib/downloaders/directory';
import { createJSONCollectionsListImporter } from '../../lib/importers/collections/collections';
import { createJSONIconSetImporter } from '../../lib/importers/icon-set/json';
import type { StoredIconSet } from '../../lib/types/icon-set/storage';
import type { ImportedData } from '../../lib/types/importers/common';

describe('Icon collections.json importer', () => {
	test('Import from JSON files', async () => {
		// Create importer for collections list
		const downloader = new DirectoryDownloader<ImportedData>('tests/fixtures');
		const importer = createJSONCollectionsListImporter(
			downloader,
			(prefix) => {
				// Create downloader and importer for icon set
				return createJSONIconSetImporter(new DirectoryDownloader<StoredIconSet>('tests/fixtures/json'), {
					prefix,
					filename: `/${prefix}.json`,
				});
			},
			{
				filename: '/collections.mdi.json',
			}
		);

		// Track changes
		let updateCounter = 0;
		importer._dataUpdated = async () => {
			updateCounter++;
		};

		// Initial data
		expect(importer.data).toBeUndefined();
		expect(updateCounter).toBe(0);

		// Wait for import
		await importer.init();
		expect(updateCounter).toBe(1);

		// Check data
		expect(importer.data).toBeDefined();
		const data = importer.data!;
		expect(data.prefixes).toEqual(['mdi', 'mdi-light']);
		expect(data.iconSets['mdi']).toBeDefined();
		expect(data.iconSets['mdi-light']).toBeDefined();

		// Check for update
		expect(await importer.checkForUpdate()).toBeFalsy();
		expect(updateCounter).toBe(1);
	}, 5000);

	test('Bad file', async () => {
		// Create importer for collections list
		const downloader = new DirectoryDownloader<ImportedData>('tests/fixtures');
		const importer = createJSONCollectionsListImporter(
			downloader,
			(prefix) => {
				// Create downloader and importer for icon set
				return createJSONIconSetImporter(new DirectoryDownloader<StoredIconSet>('tests/fixtures/json'), {
					prefix,
					filename: `/${prefix}.json`,
				});
			},
			{
				filename: '/collections.whatever.json',
			}
		);

		// Track changes
		let updateCounter = 0;
		importer._dataUpdated = async () => {
			updateCounter++;
		};

		// Initial data
		expect(importer.data).toBeUndefined();
		expect(updateCounter).toBe(0);

		// Wait for import
		await importer.init();
		expect(updateCounter).toBe(0);

		// Check data
		expect(importer.data).toBeUndefined();
	}, 5000);

	test('Bad icon set importers', async () => {
		// Create importer for collections list
		const downloader = new DirectoryDownloader<ImportedData>('tests/fixtures');
		const importer = createJSONCollectionsListImporter(
			downloader,
			(prefix) => {
				// Create downloader and importer for icon set
				return createJSONIconSetImporter(new DirectoryDownloader<StoredIconSet>('tests/fixtures/json'), {
					prefix,
					filename: `/mdi-light.json`,
				});
			},
			{
				filename: '/collections.mdi.json',
			}
		);

		// Track changes
		let updateCounter = 0;
		importer._dataUpdated = async () => {
			updateCounter++;
		};

		// Initial data
		expect(importer.data).toBeUndefined();
		expect(updateCounter).toBe(0);

		// Wait for import
		await importer.init();
		expect(updateCounter).toBe(1);

		// Check data
		expect(importer.data).toBeDefined();
		const data = importer.data!;
		expect(data.prefixes).toEqual(['mdi', 'mdi-light']);
		expect(data.iconSets['mdi']).toBeUndefined();
		expect(data.iconSets['mdi-light']).toBeDefined();

		// Check for update
		expect(await importer.checkForUpdate()).toBeFalsy();
		expect(updateCounter).toBe(1);
	}, 5000);
});
