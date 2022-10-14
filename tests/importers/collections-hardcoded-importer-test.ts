import { DirectoryDownloader } from '../../lib/downloaders/directory';
import { createHardcodedCollectionsListImporter } from '../../lib/importers/collections/list';
import { createJSONIconSetImporter } from '../../lib/importers/icon-set/json';
import type { StoredIconSet } from '../../lib/types/icon-set/storage';

describe('Hardcoded collections list importer', () => {
	test('Import from JSON files', async () => {
		// Create importer for collections list
		const importer = createHardcodedCollectionsListImporter(['mdi-light', 'mdi'], (prefix) => {
			// Create downloader and importer for icon set
			return createJSONIconSetImporter(new DirectoryDownloader<StoredIconSet>('tests/fixtures/json'), {
				prefix,
				filename: `/${prefix}.json`,
			});
		});

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
		expect(data.prefixes).toEqual(['mdi-light', 'mdi']);
		expect(data.iconSets['mdi']).toBeDefined();
		expect(data.iconSets['mdi-light']).toBeDefined();

		// Check for update
		expect(await importer.checkForUpdate()).toBeFalsy();
		expect(updateCounter).toBe(1);
	}, 5000);

	test('Invalid files', async () => {
		// Create importer for collections list
		const importer = createHardcodedCollectionsListImporter(['foo', 'bar'], (prefix) => {
			// Create downloader and importer for icon set
			return createJSONIconSetImporter(new DirectoryDownloader<StoredIconSet>('tests/fixtures/json'), {
				prefix,
				filename: `/${prefix}.json`,
			});
		});

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
		expect(data.prefixes).toEqual(['foo', 'bar']);
		expect(data.iconSets['foo']).toBeUndefined();
		expect(data.iconSets['bar']).toBeUndefined();

		// Check for update
		expect(await importer.checkForUpdate()).toBeFalsy();
		expect(updateCounter).toBe(1);
	}, 5000);
});
