import { DirectoryDownloader } from '../../lib/downloaders/directory';
import { createHardcodedCollectionsListImporter } from '../../lib/importers/collections/list';
import { createJSONIconSetImporter } from '../../lib/importers/icon-set/json';
import { updateSearchIndex } from '../../lib/data/search';
import { getPartialKeywords } from '../../lib/data/search/partial';
import { filterSearchPrefixes } from '../../lib/data/search/prefixes';
import type { IconSetImportedData } from '../../lib/types/importers/common';
import type { IconSetEntry } from '../../lib/types/importers';
import type { SearchParams } from '../../lib/types/search';

describe('Creating search index, checking prefixes', () => {
	test('One icon set', async () => {
		// Create importer
		const importer = createHardcodedCollectionsListImporter(['mdi-light'], (prefix) =>
			createJSONIconSetImporter(new DirectoryDownloader<IconSetImportedData>(`tests/fixtures/json`), {
				prefix,
				filename: `/${prefix}.json`,
			})
		);
		await importer.init();
		const data = importer.data!;

		// Get keywords for mdi-light
		const mdiLightData = data.iconSets['mdi-light']!;
		const mdiLightKeywords = mdiLightData.icons.keywords!;
		expect(mdiLightKeywords).toBeTruthy();

		const accountKeyword = mdiLightKeywords['account']!;
		expect(accountKeyword).toBeTruthy();
		expect(accountKeyword.size).toBe(2);

		const xmlKeyword = mdiLightKeywords['xml']!;
		expect(xmlKeyword).toBeTruthy();
		expect(xmlKeyword.size).toBe(1);

		// Create search index
		const prefixes = data.prefixes;
		expect(prefixes).toEqual(['mdi-light']);
		const searchIndex = updateSearchIndex(prefixes, {
			'mdi-light': {
				importer,
				item: mdiLightData,
			},
		})!;

		// Check index
		expect(searchIndex).toBeTruthy();
		expect(searchIndex!.sortedPrefixes).toEqual(['mdi-light']);
		expect(Object.keys(searchIndex.keywords)).toEqual(Object.keys(mdiLightKeywords));

		expect(searchIndex.keywords['account']).toEqual(new Set(['mdi-light']));
		expect(searchIndex.keywords['xml']).toEqual(new Set(['mdi-light']));

		// Check for partial keywords
		expect(getPartialKeywords('acc', true, searchIndex)).toEqual(['account']);
		expect(getPartialKeywords('arr', true, searchIndex)).toEqual(['arrow', 'arrange']);
		expect(getPartialKeywords('row', true, searchIndex)).toEqual(['arrow']);
		expect(getPartialKeywords('one', true, searchIndex)).toEqual(['none', 'phone', 'microphone']);
		expect(getPartialKeywords('one', false, searchIndex)).toEqual([]);
	}, 5000);

	test('Two icon sets', async () => {
		// Create importer
		// Use 'mdi-test-prefix' instead of 'mdi' to test prefix filters
		const importer = createHardcodedCollectionsListImporter(['mdi-light', 'mdi-test-prefix'], (prefix) =>
			createJSONIconSetImporter(new DirectoryDownloader<IconSetImportedData>(`tests/fixtures/json`), {
				prefix,
				filename: prefix === 'mdi-test-prefix' ? '/mdi.json' : `/${prefix}.json`,
				ignoreInvalidPrefix: true,
			})
		);
		await importer.init();
		const data = importer.data!;

		// Get keywords
		const mdiData = data.iconSets['mdi-test-prefix']!;
		const mdiKeywords = mdiData.icons.keywords!;
		expect(mdiKeywords).toBeTruthy();

		const mdiLightData = data.iconSets['mdi-light']!;
		const mdiLightKeywords = mdiLightData.icons.keywords!;
		expect(mdiLightKeywords).toBeTruthy();

		// Create search index
		const prefixes = data.prefixes;
		expect(prefixes).toEqual(['mdi-light', 'mdi-test-prefix']);
		const iconSets: Record<string, IconSetEntry> = {
			'mdi-light': {
				importer,
				item: mdiLightData,
			},
			'mdi-test-prefix': {
				importer,
				item: mdiData,
			},
		};
		const searchIndex = updateSearchIndex(prefixes, iconSets)!;

		// Check index
		expect(searchIndex).toBeTruthy();
		expect(searchIndex!.sortedPrefixes).toEqual(['mdi-light', 'mdi-test-prefix']);

		expect(Object.keys(searchIndex.keywords)).not.toEqual(Object.keys(mdiLightKeywords));
		expect(Object.keys(searchIndex.keywords)).not.toEqual(Object.keys(mdiKeywords));
		expect(new Set(Object.keys(searchIndex.keywords))).toEqual(
			new Set([...Object.keys(mdiKeywords), ...Object.keys(mdiLightKeywords)])
		);

		expect(searchIndex.keywords['account']).toEqual(new Set(['mdi-light', 'mdi-test-prefix']));
		expect(searchIndex.keywords['xml']).toEqual(new Set(['mdi-light', 'mdi-test-prefix']));
		expect(searchIndex.keywords['alphabetical']).toEqual(new Set(['mdi-test-prefix']));

		// Test filter
		const baseParams: SearchParams = {
			keyword: '',
			limit: 0,
		};
		expect(filterSearchPrefixes(searchIndex, iconSets, baseParams)).toEqual(['mdi-light', 'mdi-test-prefix']);

		// Test filter by prefixes
		expect(
			filterSearchPrefixes(searchIndex, iconSets, {
				...baseParams,
				prefixes: ['mdi-light', 'whatever'],
			})
		).toEqual(['mdi-light']);
		expect(
			filterSearchPrefixes(searchIndex, iconSets, {
				...baseParams,
				prefixes: ['mdi-'],
			})
		).toEqual(['mdi-light', 'mdi-test-prefix']);
		expect(
			filterSearchPrefixes(searchIndex, iconSets, {
				...baseParams,
				prefixes: ['mdi', 'mdi-test-'],
			})
		).toEqual(['mdi-test-prefix']);
		expect(
			filterSearchPrefixes(searchIndex, iconSets, {
				...baseParams,
				prefixes: ['material'],
			})
		).toEqual([]);

		// Add palette
		expect(
			filterSearchPrefixes(searchIndex, iconSets, {
				...baseParams,
				palette: false,
			})
		).toEqual(['mdi-light', 'mdi-test-prefix']);
		expect(
			filterSearchPrefixes(searchIndex, iconSets, {
				...baseParams,
				prefixes: ['mdi-test-prefix'],
				palette: false,
			})
		).toEqual(['mdi-test-prefix']);
		expect(
			filterSearchPrefixes(searchIndex, iconSets, {
				...baseParams,
				palette: true,
			})
		).toEqual([]);

		// Style
		expect(
			filterSearchPrefixes(searchIndex, iconSets, {
				...baseParams,
				style: 'fill',
			})
		).toEqual(['mdi-light', 'mdi-test-prefix']);
		expect(
			filterSearchPrefixes(searchIndex, iconSets, {
				...baseParams,
				style: 'stroke',
			})
		).toEqual([]);
	}, 5000);
});
