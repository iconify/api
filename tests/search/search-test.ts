import { DirectoryDownloader } from '../../lib/downloaders/directory';
import { createHardcodedCollectionsListImporter } from '../../lib/importers/collections/list';
import { createJSONIconSetImporter } from '../../lib/importers/icon-set/json';
import { updateSearchIndex } from '../../lib/data/search';
import { search } from '../../lib/data/search/index';
import type { IconSetImportedData } from '../../lib/types/importers/common';
import type { IconSetEntry } from '../../lib/types/importers';

describe('Searching icons', () => {
	test('Multiple icon sets', async () => {
		// Create importer
		const importer = createHardcodedCollectionsListImporter(
			['mdi-light', 'mdi-test-prefix', 'emojione-v1'],
			(prefix) => {
				let filename: string;
				switch (prefix) {
					case 'mdi-test-prefix':
						filename = '/json/mdi.json';
						break;

					case 'mdi':
					case 'mdi-light':
						filename = `/json/${prefix}.json`;
						break;

					default:
						filename = `/${prefix}.json`;
				}
				return createJSONIconSetImporter(new DirectoryDownloader<IconSetImportedData>(`tests/fixtures`), {
					prefix,
					filename,
					ignoreInvalidPrefix: true,
				});
			}
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
		expect(prefixes).toEqual(['mdi-light', 'mdi-test-prefix', 'emojione-v1']);

		const iconSets: Record<string, IconSetEntry> = {};
		prefixes.forEach((prefix) => {
			iconSets[prefix] = {
				importer,
				item: data.iconSets[prefix]!,
			};
		});
		const searchIndex = updateSearchIndex(prefixes, iconSets)!;

		// Check index
		expect(searchIndex).toBeTruthy();
		expect(searchIndex!.sortedPrefixes).toEqual(['mdi-light', 'mdi-test-prefix', 'emojione-v1']);

		// Search
		expect(
			search(
				{
					keyword: 'cycle',
					limit: 999,
				},
				searchIndex,
				iconSets
			)
		).toEqual({
			prefixes: ['mdi-test-prefix', 'emojione-v1'],
			names: [
				'mdi-test-prefix:cash-cycle',
				'mdi-test-prefix:hand-cycle',
				'mdi-test-prefix:power-cycle',
				'mdi-test-prefix:bicycle',
				'emojione-v1:bicycle',
				'mdi-test-prefix:recycle',
				'mdi-test-prefix:unicycle',
				'mdi-test-prefix:motorcycle',
				'emojione-v1:motorcycle',
				'mdi-test-prefix:bicycle-cargo',
				'mdi-test-prefix:water-recycle',
				'mdi-test-prefix:bicycle-basket',
				'mdi-test-prefix:motorcycle-off',
				'mdi-test-prefix:battery-recycle',
				'mdi-test-prefix:battery-recycle-outline',
				'mdi-test-prefix:recycle-variant',
				'mdi-test-prefix:bicycle-electric',
				'mdi-test-prefix:motorcycle-electric',
				'mdi-test-prefix:bicycle-penny-farthing',
			],
			hasMore: false,
		});

		// Search with category filter
		expect(
			search(
				{
					keyword: 'cycle',
					limit: 999,
					category: 'General',
				},
				searchIndex,
				iconSets
			)
		).toEqual({
			prefixes: ['mdi-test-prefix'],
			names: [
				'mdi-test-prefix:cash-cycle',
				'mdi-test-prefix:hand-cycle',
				'mdi-test-prefix:power-cycle',
				'mdi-test-prefix:bicycle',
				'mdi-test-prefix:recycle',
				'mdi-test-prefix:unicycle',
				'mdi-test-prefix:motorcycle',
				'mdi-test-prefix:bicycle-cargo',
				'mdi-test-prefix:water-recycle',
				'mdi-test-prefix:bicycle-basket',
				'mdi-test-prefix:motorcycle-off',
				'mdi-test-prefix:battery-recycle',
				'mdi-test-prefix:battery-recycle-outline',
				'mdi-test-prefix:recycle-variant',
				'mdi-test-prefix:bicycle-electric',
				'mdi-test-prefix:motorcycle-electric',
				'mdi-test-prefix:bicycle-penny-farthing',
			],
			hasMore: false,
		});

		// Search with style and palette
		expect(
			search(
				{
					keyword: 'bookmark style:fill palette:true',
					limit: 999,
				},
				searchIndex,
				iconSets
			)
		).toEqual({
			prefixes: ['emojione-v1'],
			names: ['emojione-v1:bookmark', 'emojione-v1:bookmark-tabs'],
			hasMore: false,
		});
	}, 5000);
});
