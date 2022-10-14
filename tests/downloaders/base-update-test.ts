import { BaseDownloader } from '../../lib/downloaders/base';

type BooleanCallback = (value: boolean) => void;
type RejectCallback = (value: unknown) => void;

describe('Updating BaseDownloader class', () => {
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
		contentLoaded = 0;
		async _loadContent() {
			this.contentLoaded++;
		}

		/**
		 * Check for update
		 */
		updateCalled: ((done: BooleanCallback) => void) | undefined;
		_checkForUpdate(done: (value: boolean) => void) {
			this.updateCalled?.(done);
		}
	}

	test('Nothing to update after init', async () => {
		// Create new instance, init
		const test = new BaseDownloaderTest();
		test.initCalled = (done) => done(true);
		await test.init();

		expect(test.initTested).toBe(true);
		expect(test.status).toBe(true);
		expect(test.contentLoaded).toBe(1);

		// Reload
		let updateCounter = 0;
		const updateResult = await new Promise((fulfill, reject) => {
			// Setup callback
			test.updateCalled = (done) => {
				updateCounter++;

				try {
					expect(test.status).toBe('updating');
					expect(updateCounter).toBe(1);
				} catch (err) {
					reject(err);
					return;
				}

				done(false);
			};

			// Get result
			test.checkForUpdate().then(fulfill).catch(reject);
		});

		expect(updateResult).toBe(false);
		expect(test.status).toBe(true);
		expect(updateCounter).toBe(1);
		expect(test.contentLoaded).toBe(1);
	});

	test('Successful update after init', async () => {
		// Create new instance, init
		const test = new BaseDownloaderTest();
		test.initCalled = (done) => done(true);
		await test.init();

		expect(test.initTested).toBe(true);
		expect(test.status).toBe(true);
		expect(test.contentLoaded).toBe(1);

		// Reload
		let updateCounter = 0;
		const updateResult = await new Promise((fulfill, reject) => {
			// Setup callback
			test.updateCalled = (done) => {
				updateCounter++;

				try {
					expect(test.status).toBe('updating');
					expect(updateCounter).toBe(1);
				} catch (err) {
					reject(err);
					return;
				}

				done(true);
			};

			// Get result
			test.checkForUpdate().then(fulfill).catch(reject);
		});

		expect(updateResult).toBe(true);
		expect(test.status).toBe(true);
		expect(updateCounter).toBe(1);
		expect(test.contentLoaded).toBe(2);
	});

	test('Multiple sequential updates, success on first run', async () => {
		// Create new instance, init
		const test = new BaseDownloaderTest();
		test.initCalled = (done) => done(true);
		await test.init();

		// Reload
		let updateCounter = 0;
		const updateResult = await new Promise((fulfill, reject) => {
			// Setup callback
			test.updateCalled = (done) => {
				updateCounter++;

				// Success only on first reload
				done(updateCounter === 1);
			};

			// Get result
			test.checkForUpdate().then(fulfill).catch(reject);
		});

		expect(updateResult).toBe(true);
		expect(test.status).toBe(true);
		expect(updateCounter).toBe(1);
		expect(test.contentLoaded).toBe(2);

		// Another reload
		const update2Result = await test.checkForUpdate();
		expect(update2Result).toBe(false);
		expect(test.status).toBe(true);
		expect(updateCounter).toBe(2);
		expect(test.contentLoaded).toBe(2);
	});

	test('Multiple sequential updates, success on last run', async () => {
		// Create new instance, init
		const test = new BaseDownloaderTest();
		test.initCalled = (done) => done(true);
		await test.init();

		// Reload
		let updateCounter = 0;
		const updateResult = await new Promise((fulfill, reject) => {
			// Setup callback
			test.updateCalled = (done) => {
				updateCounter++;

				// Success only on last reload
				done(updateCounter === 2);
			};

			// Get result
			test.checkForUpdate().then(fulfill).catch(reject);
		});

		expect(updateResult).toBe(false);
		expect(test.status).toBe(true);
		expect(updateCounter).toBe(1);
		expect(test.contentLoaded).toBe(1);

		// Another reload
		const update2Result = await test.checkForUpdate();
		expect(update2Result).toBe(true);
		expect(test.status).toBe(true);
		expect(updateCounter).toBe(2);
		expect(test.contentLoaded).toBe(2);
	});

	test('Multiple updates at once', async () => {
		// Create new instance, init
		const test = new BaseDownloaderTest();
		test.initCalled = (done) => done(true);
		await test.init();

		await new Promise((fulfill, reject) => {
			// Setup callback
			let updateCounter = 0;
			let isSync = true;
			let finishUpdate: BooleanCallback | undefined;

			test.updateCalled = (done) => {
				updateCounter++;

				if (updateCounter === 1) {
					// First run: complete asynchronously
					finishUpdate = done;
					return;
				}

				// Second run: complete immediately
				done(false);
			};

			// Results
			let result1: boolean | undefined;
			let result2: boolean | undefined;
			let result3: boolean | undefined;
			let result4: boolean | undefined;

			const tested = () => {
				if (result1 === void 0 || result2 === void 0 || result3 === void 0 || result4 === void 0) {
					// Still waiting
					return;
				}

				try {
					expect(result1).toBe(true);
					expect(result2).toBe(false);
					expect(result3).toBe(false);
					expect(result4).toBe(false);
					expect(updateCounter).toBe(2);
				} catch (err) {
					reject(err);
					return;
				}
				fulfill(true);
			};

			// Run test twice
			test.checkForUpdate()
				.then((value) => {
					result1 = value;
					tested();
				})
				.catch(reject);
			test.checkForUpdate()
				.then((value) => {
					result2 = value;
					tested();
				})
				.catch(reject);
			test.checkForUpdate()
				.then((value) => {
					result3 = value;
					tested();
				})
				.catch(reject);
			test.checkForUpdate()
				.then((value) => {
					result4 = value;
					tested();
				})
				.catch(reject);

			isSync = false;

			// Finish loading asynchronously
			setTimeout(() => {
				try {
					expect(finishUpdate).toBeDefined();
					expect(updateCounter).toBe(1);
					finishUpdate?.(true);
				} catch (err) {
					reject(err);
				}
			});
		});
	});

	test('Multiple updates at once, resetting pending check', async () => {
		// Create new instance, init
		const test = new BaseDownloaderTest();
		test.initCalled = (done) => done(true);
		await test.init();

		await new Promise((fulfill, reject) => {
			// Setup callback
			let updateCounter = 0;
			let isSync = true;
			let finishUpdate: BooleanCallback | undefined;

			test.updateCalled = (done) => {
				updateCounter++;

				if (updateCounter === 1) {
					// First run: complete asynchronously
					finishUpdate = done;
					return;
				}

				// Second run: should not be ran!
				reject('updateCalled() should not be ran more than once');
			};

			// Results
			let result1: boolean | undefined;
			let result2: boolean | undefined;

			const tested = () => {
				if (result1 === void 0 || result2 === void 0) {
					// Still waiting
					return;
				}

				try {
					expect(result1).toBe(true);
					expect(result2).toBe(false);

					expect(updateCounter).toBe(1);
				} catch (err) {
					reject(err);
					return;
				}
				fulfill(true);
			};

			// Run test twice
			test.checkForUpdate()
				.then((value) => {
					result1 = value;
					tested();
				})
				.catch(reject);
			test.checkForUpdate()
				.then((value) => {
					result2 = value;
					tested();
				})
				.catch(reject);

			isSync = false;

			// Finish loading asynchronously
			setTimeout(() => {
				try {
					expect(finishUpdate).toBeDefined();
					expect(updateCounter).toBe(1);
					test._pendingReload = false;
					finishUpdate?.(true);
				} catch (err) {
					reject(err);
				}
			});
		});
	});
});
