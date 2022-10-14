import { DirectoryDownloader } from '../../lib/downloaders/directory';
import { createJSONDirectoryImporter } from '../../lib/importers/full/directory-json';
import type { ImportedData } from '../../lib/types/importers/common';

describe('JSON files from directory importer', () => {
	test('Scan directory', async () => {
		// Create importer for collections list
		const importer = createJSONDirectoryImporter(new DirectoryDownloader<ImportedData>('tests/fixtures/json'));

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
});
