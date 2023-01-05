import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { DirectoryDownloader } from '../../lib/downloaders/directory';
import { uniqueCacheDir } from '../helpers';

describe('Directory downloader', () => {
	class TestDownloader extends DirectoryDownloader<unknown> {
		/**
		 * Test _loadContent()
		 */
		contentLoaded = 0;
		async _loadContent() {
			this.contentLoaded++;
		}
	}

	function delay() {
		return new Promise((fulfill) => {
			setTimeout(fulfill, 100);
		});
	}

	test('Existing files', async () => {
		// Create new instance
		const test = new TestDownloader('tests/fixtures');
		expect(test.status).toBe('pending-init');
		expect(await test.init()).toBe(true);
		expect(test.contentLoaded).toBe(1);

		// Nothing to update
		expect(await test.checkForUpdate()).toBe(false);
		expect(test.contentLoaded).toBe(1);
	});

	test('Invalid directory', async () => {
		// Cache directory
		const dir = 'cache/' + uniqueCacheDir();

		// Create new instance
		const test = new TestDownloader(dir);
		expect(test.status).toBe('pending-init');
		expect(await test.init()).toBe(false);
		expect(test.contentLoaded).toBe(0);

		// Nothing to update
		expect(await test.checkForUpdate()).toBe(false);
		expect(test.contentLoaded).toBe(0);
	});

	test('Empty directory', async () => {
		// Cache directory
		const dir = 'cache/' + uniqueCacheDir();
		try {
			await mkdir(dir, {
				recursive: true,
			});
		} catch {
			//
		}

		// Create new instance
		const test = new TestDownloader(dir);
		expect(test.status).toBe('pending-init');
		expect(await test.init()).toBe(true);
		expect(test.contentLoaded).toBe(1);

		// Nothing to update
		expect(await test.checkForUpdate()).toBe(false);
		expect(test.contentLoaded).toBe(1);
	});

	test('Has content', async () => {
		// Cache directory
		const dir = 'cache/' + uniqueCacheDir();
		try {
			await mkdir(dir, {
				recursive: true,
			});
		} catch {
			//
		}

		// Create few files
		await writeFile(dir + '/collections.json', await readFile('tests/fixtures/collections.mdi.json'));
		await writeFile(dir + '/mdi.json', await readFile('tests/fixtures/json/mdi.json'));

		// Create new instance
		const test = new TestDownloader(dir);
		expect(test.status).toBe('pending-init');
		expect(await test.init()).toBe(true);
		expect(test.contentLoaded).toBe(1);

		// Nothing to update
		expect(await test.checkForUpdate()).toBe(false);
		expect(test.contentLoaded).toBe(1);

		// Replace file
		await delay();
		await writeFile(dir + '/mdi.json', await readFile('tests/fixtures/json/mdi-light.json'));
		expect(await test.checkForUpdate()).toBe(true);
		expect(test.contentLoaded).toBe(2);

		// Touch file: should trigger update because file modification time changes
		await delay();
		await writeFile(dir + '/mdi.json', await readFile('tests/fixtures/json/mdi-light.json'));
		expect(await test.checkForUpdate()).toBe(true);
		expect(test.contentLoaded).toBe(3);

		// Add new file
		await delay();
		await writeFile(dir + '/mdi-light.json', await readFile('tests/fixtures/json/mdi-light.json'));

		// Check for update
		expect(await test.checkForUpdate()).toBe(true);
		expect(test.contentLoaded).toBe(4);

		// Delete
		await rm(dir + '/mdi-light.json');
		expect(await test.checkForUpdate()).toBe(true);
		expect(test.contentLoaded).toBe(5);

		// Check again: nothing to update
		expect(await test.checkForUpdate()).toBe(false);
		expect(test.contentLoaded).toBe(5);
	});
});
