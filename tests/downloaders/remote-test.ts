import { readFile, rm, writeFile } from 'node:fs/promises';
import { RemoteDownloader } from '../../lib/downloaders/remote';
import { getDownloadDirectory } from '../../lib/downloaders/remote/target';
import type { RemoteDownloaderOptions } from '../../lib/types/downloaders/remote';

describe('Remote downloader', () => {
	class TestDownloader extends RemoteDownloader<unknown> {
		/**
		 * Test _loadContent()
		 */
		contentLoaded = 0;
		async _loadContent() {
			this.contentLoaded++;
		}
	}

	test('NPM package', async () => {
		// Clean up target directory
		const options: RemoteDownloaderOptions = {
			downloadType: 'npm',
			package: '@iconify-json/mi',
		};
		try {
			await rm(getDownloadDirectory(options), {
				recursive: true,
			});
		} catch {
			//
		}

		// Create new instance
		const test = new TestDownloader(options, false);
		expect(test.status).toBe('pending-init');
		await test.init();
		expect(test.contentLoaded).toBe(1);

		// Nothing to update
		expect(await test.checkForUpdate()).toBe(false);
		expect(test.contentLoaded).toBe(1);

		// Change version number
		const directory = test._sourceDir as string;
		const filename = directory + '/package.json';
		const data = JSON.parse(await readFile(filename, 'utf8')) as Record<string, unknown>;
		data.version = '1.0.0';
		await writeFile(filename, JSON.stringify(data, null, '\t'), 'utf8');

		// NPM updater checks content, so this should trigger update
		expect(await test.checkForUpdate()).toBe(true);
		expect(test.contentLoaded).toBe(2);

		// Check package.json
		const data2 = JSON.parse(await readFile(filename, 'utf8')) as Record<string, unknown>;
		expect(data2.version).not.toBe(data.version);
	}, 10000);
});
