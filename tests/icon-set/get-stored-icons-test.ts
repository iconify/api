import type { IconifyIcons, IconifyJSON } from '@iconify/types';
import { storeLoadedIconSet } from '../../lib/data/icon-set/store/storage';
import { getStoredIconsData } from '../../lib/data/icon-set/utils/get-icons';
import { createStorage } from '../../lib/data/storage/create';
import type { StoredIconSet } from '../../lib/types/icon-set/storage';
import { loadFixture, uniqueCacheDir } from '../helpers';

describe('Loading icons from storage', () => {
	test('Get existing icons', async () => {
		const iconSet = JSON.parse(await loadFixture('json/mdi-light.json')) as IconifyJSON;

		function store(): Promise<StoredIconSet> {
			return new Promise((fulfill, reject) => {
				// Create storage
				const dir = uniqueCacheDir();
				const cacheDir = '{cache}/' + dir;
				const storage = createStorage<IconifyIcons>({
					cacheDir,
					maxCount: 2,
				});

				// Split icon set
				storeLoadedIconSet(iconSet, fulfill, storage, {
					chunkSize: 5000,
					minIconsPerChunk: 10,
				});
			});
		}
		const storedIconSet = await store();

		function getIcons(): Promise<IconifyJSON> {
			return new Promise((fulfill, reject) => {
				getStoredIconsData(
					storedIconSet,
					[
						// Icons that exist
						'account',
						'camcorder',
						'camera',
						'monitor',
						'note',
						'paperclip',
						'wallet',
						'xml',
					],
					fulfill
				);
			});
		}
		const data = await getIcons();

		expect(data).toEqual({
			prefix: 'mdi-light',
			lastModified: iconSet.lastModified,
			icons: {
				account: iconSet.icons['account'],
				camcorder: iconSet.icons['camcorder'],
				camera: iconSet.icons['camera'],
				monitor: iconSet.icons['monitor'],
				note: iconSet.icons['note'],
				paperclip: iconSet.icons['paperclip'],
				wallet: iconSet.icons['wallet'],
				xml: iconSet.icons['xml'],
			},
			aliases: {},
			width: 24,
			height: 24,
		});
	});

	test('Aliases, missing icons', async () => {
		const iconSet = JSON.parse(await loadFixture('json/mdi.json')) as IconifyJSON;

		function store(): Promise<StoredIconSet> {
			return new Promise((fulfill, reject) => {
				// Create storage
				const dir = uniqueCacheDir();
				const cacheDir = '{cache}/' + dir;
				const storage = createStorage<IconifyIcons>({
					cacheDir,
					maxCount: 2,
				});

				// Split icon set
				storeLoadedIconSet(iconSet, fulfill, storage, {
					chunkSize: 100000,
					minIconsPerChunk: 50,
				});
			});
		}
		const storedIconSet = await store();

		function getIcons(): Promise<IconifyJSON> {
			return new Promise((fulfill, reject) => {
				getStoredIconsData(
					storedIconSet,
					[
						// Icons that exist
						'abacus',
						'abjad-arabic',
						'abjad-hebrew',
						'floor-1',
						'folder-swap',
						'folder-swap-outline',
						// Missing icons
						'no-such-icon',
						'foo',
						// Aliases
						'123',
						'1-2-3',
						'1up',
						'accessible',
						// Chars
						'f1ba4',
					],
					fulfill
				);
			});
		}
		const data = await getIcons();

		// Sort missing icons: they might be in any order
		const not_found = data.not_found?.sort((a, b) => a.localeCompare(b));
		expect(not_found).toEqual(['foo', 'no-such-icon']);

		expect(data).toEqual({
			prefix: 'mdi',
			lastModified: iconSet.lastModified,
			icons: {
				'abacus': iconSet.icons['abacus'],
				'abjad-arabic': iconSet.icons['abjad-arabic'],
				'abjad-hebrew': iconSet.icons['abjad-hebrew'],
				'account-card': iconSet.icons['account-card'],
				'floor-1': iconSet.icons['floor-1'],
				'folder-swap': iconSet.icons['folder-swap'],
				'folder-swap-outline': iconSet.icons['folder-swap-outline'],
				'numeric': iconSet.icons['numeric'],
				'one-up': iconSet.icons['one-up'],
				'wheelchair': iconSet.icons['wheelchair'],
			},
			aliases: {
				'123': {
					parent: 'numeric',
				},
				'1-2-3': {
					parent: 'numeric',
				},
				'1up': {
					parent: 'one-up',
				},
				'accessible': {
					parent: 'wheelchair',
				},
				'f1ba4': {
					parent: 'account-card',
				},
			},
			not_found,
			width: 24,
			height: 24,
		});
	});

	test('Synchronous loading', async () => {
		const iconSet = JSON.parse(await loadFixture('json/mdi-light.json')) as IconifyJSON;

		function store(): Promise<StoredIconSet> {
			return new Promise((fulfill, reject) => {
				// Create storage
				const dir = uniqueCacheDir();
				const cacheDir = '{cache}/' + dir;
				const storage = createStorage<IconifyIcons>({
					cacheDir,
					maxCount: 5,
				});

				// Split icon set
				storeLoadedIconSet(iconSet, fulfill, storage, {
					chunkSize: 5000,
					minIconsPerChunk: 10,
				});
			});
		}
		const storedIconSet = await store();

		function syncTest(): Promise<boolean> {
			return new Promise((fulfill, reject) => {
				const names: string[] = ['abacus', 'floor-1', 'star', 'wifi'];
				let isSync1 = true;

				// First run should be async if loader uses async read, synchronous if loaded uses sync read
				getStoredIconsData(storedIconSet, names, () => {
					let isSync2 = true;

					// Second run should be synchronous
					getStoredIconsData(storedIconSet, names, () => {
						fulfill(isSync2 === true && isSync1 === true);
					});
					isSync2 = false;
				});
				isSync1 = false;
			});
		}

		// Load icons
		expect(await syncTest()).toBeTruthy();
	});

	test('Asynchronous loading', async () => {
		const iconSet = JSON.parse(await loadFixture('json/mdi-light.json')) as IconifyJSON;

		function store(): Promise<StoredIconSet> {
			return new Promise((fulfill, reject) => {
				// Create storage
				const dir = uniqueCacheDir();
				const cacheDir = '{cache}/' + dir;
				const storage = createStorage<IconifyIcons>({
					cacheDir,
					maxCount: 5,
					asyncRead: true,
				});

				// Split icon set
				storeLoadedIconSet(iconSet, fulfill, storage, {
					chunkSize: 5000,
					minIconsPerChunk: 10,
				});
			});
		}
		const storedIconSet = await store();

		function syncTest(): Promise<boolean> {
			return new Promise((fulfill, reject) => {
				const names: string[] = ['abacus', 'floor-1', 'star', 'wifi'];
				let isSync1 = true;

				// First run should be async if loader uses async read, synchronous if loaded uses sync read
				getStoredIconsData(storedIconSet, names, () => {
					let isSync2 = true;

					// Second run should be synchronous
					getStoredIconsData(storedIconSet, names, () => {
						fulfill(isSync2 === true && isSync1 === false);
					});
					isSync2 = false;
				});
				isSync1 = false;
			});
		}

		// Load icons
		expect(await syncTest()).toBeTruthy();
	});
});
