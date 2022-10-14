import { BaseDownloader } from '../../lib/downloaders/base';

type BooleanCallback = (value: boolean) => void;
type RejectCallback = (value: unknown) => void;

describe('Initialising BaseDownloader class', () => {
	class BaseDownloaderTest extends BaseDownloader<unknown> {
		/**
		 * Test init()
		 */
		initTested = false;

		initCalled: ((done: BooleanCallback, reject: RejectCallback) => void) | undefined;

		_init(): Promise<boolean> {
			this.initTested = true;
			return new Promise((fulfill, reject) => {
				this.initCalled?.(fulfill, reject);
			});
		}

		/**
		 * Test _loadContent()
		 */
		contentLoaded = false;
		async _loadContent() {
			this.contentLoaded = true;
		}
	}

	test('Initialising', async () => {
		// Create new instance, init
		const test = new BaseDownloaderTest();
		expect(test.status).toBe('pending-init');

		// Initialise
		expect(test.initTested).toBe(false);
		expect(test.contentLoaded).toBe(false);
		const initResult = await new Promise((fulfill, reject) => {
			// Add callback
			test.initCalled = (done) => {
				// _init() is run
				try {
					expect(test.initTested).toBe(true);
					expect(test.contentLoaded).toBe(false);
					expect(test.status).toBe('initialising');

					// Finish init()
					done(true);
				} catch (err) {
					reject(err);
				}
			};

			// Run init
			test.init().then(fulfill).catch(reject);

			// ... continues in initCalled() above
		});

		// Result
		expect(initResult).toBe(true);
		expect(test.status).toBe(true);
		expect(test.contentLoaded).toBe(true);
	});

	test('Failing to init', async () => {
		// Create new instance, init
		const test = new BaseDownloaderTest();

		// Initialise
		const initResult = await new Promise((fulfill, reject) => {
			// Add callback
			test.initCalled = (done, fail) => {
				// _init() is run
				try {
					expect(test.initTested).toBe(true);
					expect(test.status).toBe('initialising');

					// Finish init() with error
					fail('Expected fatal error in downloader (unit test passes!)');
				} catch (err) {
					reject(err);
				}
			};

			// Run init
			test.init().then(fulfill).catch(reject);

			// ... continues in initCalled() above
		});

		// Result: status should be false, content should not be loaded
		expect(initResult).toBe(false);
		expect(test.status).toBe(false);
		expect(test.contentLoaded).toBe(false);
	});
});
