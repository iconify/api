import type { ExtendedIconifyIcon, IconifyIcons, IconifyJSON } from '@iconify/types';
import { storeLoadedIconSet } from '../../lib/data/icon-set/store/storage';
import { getStoredIconData } from '../../lib/data/icon-set/utils/get-icon';
import { createStorage } from '../../lib/data/storage/create';
import type { StoredIconSet } from '../../lib/types/icon-set/storage';
import { loadFixture, uniqueCacheDir } from '../helpers';

describe('Loading icon data from storage', () => {
	test('Testing mdi', async () => {
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
					chunkSize: 5000,
					minIconsPerChunk: 10,
				});
			});
		}
		const storedIconSet = await store();

		function getIcon(name: string): Promise<ExtendedIconifyIcon | null> {
			return new Promise((fulfill, reject) => {
				getStoredIconData(storedIconSet, name, (data) => {
					try {
						fulfill(data);
					} catch (err) {
						reject(err);
					}
				});
			});
		}

		// Icons
		expect(await getIcon('abacus')).toEqual({
			body: iconSet.icons['abacus'].body,
			width: 24,
			height: 24,
		});

		expect(await getIcon('account-off')).toEqual({
			body: iconSet.icons['account-off'].body,
			width: 24,
			height: 24,
		});

		// Aliases
		expect(await getIcon('123')).toEqual({
			body: iconSet.icons['numeric'].body,
			width: 24,
			height: 24,
		});

		// Missing icons
		expect(await getIcon('foo')).toBeNull();

		// Characters
		expect(await getIcon('f16e0')).toEqual({
			body: iconSet.icons['abacus'].body,
			width: 24,
			height: 24,
		});
	});

	test('Testing complex aliases', async () => {
		const iconSet: IconifyJSON = {
			prefix: 'test',
			icons: {
				foo: {
					body: '<g id="main" />',
					width: 16,
					height: 16,
				},
			},
			aliases: {
				'bar': {
					parent: 'foo',
					hFlip: true,
				},
				'bar-wide': {
					parent: 'bar',
					width: 24,
					left: -4,
				},
			},
			width: 24,
		};

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
					chunkSize: 0,
					minIconsPerChunk: 10,
				});
			});
		}
		const storedIconSet = await store();

		function getIcon(name: string): Promise<ExtendedIconifyIcon | null> {
			return new Promise((fulfill, reject) => {
				getStoredIconData(storedIconSet, name, (data) => {
					try {
						fulfill(data);
					} catch (err) {
						reject(err);
					}
				});
			});
		}

		// Icons
		expect(await getIcon('foo')).toEqual({
			body: '<g id="main" />',
			width: 16,
			height: 16,
		});

		// Aliases
		expect(await getIcon('bar-wide')).toEqual({
			body: '<g id="main" />',
			left: -4,
			width: 24,
			height: 16,
			hFlip: true,
		});

		// Missing icons
		expect(await getIcon('invalid-icon')).toBeNull();
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

		function syncTest(): Promise<boolean> {
			return new Promise((fulfill, reject) => {
				const name = 'star';
				let isSync1 = true;

				// First run should be async if loader uses async read, synchronous if loaded uses sync read
				getStoredIconData(storedIconSet, name, () => {
					let isSync2 = true;

					// Second run should be synchronous
					getStoredIconData(storedIconSet, name, () => {
						fulfill(isSync2 === true && isSync1 === true);
					});
					isSync2 = false;
				});
				isSync1 = false;
			});
		}

		// Load icon
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
					maxCount: 2,
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
				const name = 'star';
				let isSync1 = true;

				// First run should be async if loader uses async read, synchronous if loaded uses sync read
				getStoredIconData(storedIconSet, name, () => {
					let isSync2 = true;

					// Second run should be synchronous
					getStoredIconData(storedIconSet, name, () => {
						fulfill(isSync2 === true && isSync1 === false);
					});
					isSync2 = false;
				});
				isSync1 = false;
			});
		}

		// Load icon
		expect(await syncTest()).toBeTruthy();
	});
});
