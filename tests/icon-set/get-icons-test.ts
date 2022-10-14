import type { IconifyAliases } from '@iconify/types';
import { getIconsToRetrieve, getIconsData } from '../../lib/data/icon-set/utils/get-icons';
import { splitIconSetMainData } from '../../lib/data/icon-set/store/split';
import { loadFixture } from '../helpers';

describe('Getting icons data', () => {
	test('Getting icon names to retrieve', async () => {
		const iconSet = JSON.parse(await loadFixture('json/mdi.json'));

		const data = splitIconSetMainData(iconSet);

		// Icons without aliases
		const aliases1 = {} as IconifyAliases;
		expect(getIconsToRetrieve(data, ['account-multiple-minus', 'math-log'], aliases1)).toEqual(
			new Set(['account-multiple-minus', 'math-log'])
		);
		expect(aliases1).toEqual({});

		// Icons with aliases
		const aliases2 = {} as IconifyAliases;
		expect(getIconsToRetrieve(data, ['account-multiple-minus', '123', '1-2-3', '4k'], aliases2)).toEqual(
			new Set(['account-multiple-minus', 'numeric', 'video-4k-box'])
		);
		expect(aliases2).toEqual({
			'123': {
				parent: 'numeric',
			},
			'1-2-3': {
				parent: 'numeric',
			},
			'4k': {
				parent: 'video-4k-box',
			},
		});
	});

	test('Getting icon data from one object', async () => {
		const iconSet = JSON.parse(await loadFixture('json/mdi.json'));

		const data = splitIconSetMainData(iconSet);
		const icons = iconSet.icons;

		expect(getIconsData(data, ['123', 'windsock'], [icons])).toEqual({
			prefix: 'mdi',
			icons: {
				numeric: {
					body: '<path fill="currentColor" d="M4 17V9H2V7h4v10H4m18-2a2 2 0 0 1-2 2h-4v-2h4v-2h-2v-2h2V9h-4V7h4a2 2 0 0 1 2 2v1.5a1.5 1.5 0 0 1-1.5 1.5a1.5 1.5 0 0 1 1.5 1.5V15m-8 0v2H8v-4a2 2 0 0 1 2-2h2V9H8V7h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2v2h4Z"/>',
				},
				windsock: {
					body: '<path fill="currentColor" d="M7 5v8l15-2V7L7 5m3 1.91l3 .4v3.38l-3 .4V6.91m6 .8l3 .4v1.78l-3 .4V7.71M5 10v1h1v1H5v9H3V4c0-.55.45-1 1-1s1 .45 1 1v2h1v1H5v3Z"/>',
				},
			},
			aliases: {
				'123': {
					parent: 'numeric',
				},
			},
			width: 24,
			height: 24,
			lastModified: 1663305505,
		});
	});
});
