import type { IconifyJSON } from '@iconify/types';
import { getIconSetSplitChunksCount } from '../../lib/data/icon-set/store/split';
import { loadFixture } from '../helpers';

describe('Splitting icon set', () => {
	test('Testing config with small icon set', async () => {
		// 267 icons, 63104 bytes
		const { icons } = JSON.parse(await loadFixture('json/mdi-light.json')) as IconifyJSON;

		// Disabled
		expect(
			getIconSetSplitChunksCount(icons, {
				chunkSize: 0,
				minIconsPerChunk: 10,
			})
		).toBe(1);

		// Chunk size is more than icon set size
		expect(
			getIconSetSplitChunksCount(icons, {
				chunkSize: 100000,
				minIconsPerChunk: 10,
			})
		).toBe(1);

		// Chunk size is 6.3 times less than icon set
		expect(
			getIconSetSplitChunksCount(icons, {
				chunkSize: 10000,
				minIconsPerChunk: 10,
			})
		).toBe(6);

		// Chunk size is 63 times less than icon set, number of icons is 10 times less than in icon set
		expect(
			getIconSetSplitChunksCount(icons, {
				chunkSize: 1000,
				minIconsPerChunk: 25,
			})
		).toBe(10);
	});

	test('Testing config with big icon set', async () => {
		// 7328 icons, 2308927 bytes
		const { icons } = JSON.parse(await loadFixture('json/mdi.json')) as IconifyJSON;

		// Chunk size is 2.3 times less than icon set
		expect(
			getIconSetSplitChunksCount(icons, {
				chunkSize: 1000000,
				minIconsPerChunk: 40,
			})
		).toBe(1);

		// Chunk size is 23 times less than icon set
		expect(
			getIconSetSplitChunksCount(icons, {
				chunkSize: 100000,
				minIconsPerChunk: 40,
			})
		).toBe(23);

		// Icons count per chunk is exactly 16 less than number of icons
		expect(
			getIconSetSplitChunksCount(icons, {
				chunkSize: 10000,
				minIconsPerChunk: 7328 / 16,
			})
		).toBe(16);
	});
});
