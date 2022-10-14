import {
	splitRecords,
	createSplitRecordsTree,
	searchSplitRecordsTree,
	searchSplitRecordsTreeForSet,
} from '../../lib/data/storage/split';
import type { SplitRecord } from '../../lib/types/split';

describe('Splitting data', () => {
	test('1 chunk', () => {
		return new Promise((fulfill, reject) => {
			const data: Record<string, number> = {};
			for (let i = 0; i < 7; i++) {
				data[`test-${i}`] = i;
			}

			const split: SplitRecord<typeof data>[] = [];

			splitRecords(
				data,
				1,
				(item, next) => {
					split.push(item);
					next();
				},
				() => {
					try {
						expect(split).toEqual([
							{
								keyword: 'test-0',
								data: {
									'test-0': 0,
									'test-1': 1,
									'test-2': 2,
									'test-3': 3,
									'test-4': 4,
									'test-5': 5,
									'test-6': 6,
								},
							},
						]);
						const tree = createSplitRecordsTree(split);
						expect(tree.split).toBeFalsy();

						// Check all items, including keys that do not exist
						for (let i = -10; i < 10; i++) {
							expect(searchSplitRecordsTree(tree, `test-${i}`)).toEqual(split[0].data);
						}

						fulfill(true);
					} catch (err) {
						reject(err);
					}
				}
			);
		});
	});

	test('2 chunks', () => {
		return new Promise((fulfill, reject) => {
			const data: Record<string, number> = {};
			for (let i = 0; i < 7; i++) {
				data[`test-${i}`] = i;
			}

			const split: SplitRecord<typeof data>[] = [];

			splitRecords(
				data,
				2,
				(item, next) => {
					split.push(item);
					next();
				},
				() => {
					try {
						expect(split).toEqual([
							{
								keyword: 'test-0',
								data: {
									'test-0': 0,
									'test-1': 1,
									'test-2': 2,
									'test-3': 3,
								},
							},
							{
								keyword: 'test-4',
								data: {
									'test-4': 4,
									'test-5': 5,
									'test-6': 6,
								},
							},
						]);
						const tree = createSplitRecordsTree(split);
						expect(tree.split).toBeTruthy();

						// Check all items
						for (let i = 0; i < 4; i++) {
							expect(searchSplitRecordsTree(tree, `test-${i}`)).toEqual(split[0].data);
						}
						for (let i = 4; i < 7; i++) {
							expect(searchSplitRecordsTree(tree, `test-${i}`)).toEqual(split[1].data);
						}

						// Check items that do not exist. Keys are not checked, only alphabetical match is checked
						expect(searchSplitRecordsTree(tree, 'foo')).toEqual(split[0].data);
						expect(searchSplitRecordsTree(tree, 'z')).toEqual(split[1].data);

						// Search for multiple items
						const map1 = new Map();
						map1.set(split[0].data, ['test-0', 'test-2', 'test-10']); // '10' is compared as string, so its after 'test-1'
						map1.set(split[1].data, ['test-6']);
						expect(searchSplitRecordsTreeForSet(tree, ['test-0', 'test-2', 'test-6', 'test-10'])).toEqual(
							map1
						);

						const map2 = new Map();
						map2.set(split[1].data, ['z', 'test-4']);
						expect(searchSplitRecordsTreeForSet(tree, ['z', 'test-4'])).toEqual(map2);

						fulfill(true);
					} catch (err) {
						reject(err);
					}
				}
			);
		});
	});

	test('3 chunks. async', () => {
		return new Promise((fulfill, reject) => {
			const data: Record<string, number> = {};
			for (let i = 0; i < 7; i++) {
				data[`test-${i}`] = i;
			}

			const split: SplitRecord<typeof data>[] = [];

			splitRecords(
				data,
				3,
				(item, next) => {
					split.push(item);
					setTimeout(next);
				},
				() => {
					try {
						expect(split).toEqual([
							{
								keyword: 'test-0',
								data: {
									'test-0': 0,
									'test-1': 1,
								},
							},
							{
								keyword: 'test-2',
								data: {
									'test-2': 2,
									'test-3': 3,
									'test-4': 4,
								},
							},
							{
								keyword: 'test-5',
								data: {
									'test-5': 5,
									'test-6': 6,
								},
							},
						]);
						const tree = createSplitRecordsTree(split);
						expect(tree.split).toBeTruthy();

						// Check all items
						for (let i = 0; i < 2; i++) {
							expect(searchSplitRecordsTree(tree, `test-${i}`)).toEqual(split[0].data);
						}
						for (let i = 2; i < 5; i++) {
							expect(searchSplitRecordsTree(tree, `test-${i}`)).toEqual(split[1].data);
						}
						for (let i = 5; i < 7; i++) {
							expect(searchSplitRecordsTree(tree, `test-${i}`)).toEqual(split[2].data);
						}

						fulfill(true);
					} catch (err) {
						reject(err);
					}
				}
			);
		});
	});

	test('unsorted list, 2 chunks', () => {
		return new Promise((fulfill, reject) => {
			const data: Record<string, number> = {};
			for (let i = 0; i < 4; i++) {
				data[`baz-${i}`] = i;
				data[`bar-${i}`] = i;
				data[`foo-${i}`] = i;
			}

			const split: SplitRecord<typeof data>[] = [];

			splitRecords(
				data,
				2,
				(item, next) => {
					split.push(item);
					next();
				},
				() => {
					try {
						expect(split).toEqual([
							{
								keyword: 'bar-0',
								data: {
									'bar-0': 0,
									'bar-1': 1,
									'bar-2': 2,
									'bar-3': 3,
									'baz-0': 0,
									'baz-1': 1,
								},
							},
							{
								keyword: 'baz-2',
								data: {
									'baz-2': 2,
									'baz-3': 3,
									'foo-0': 0,
									'foo-1': 1,
									'foo-2': 2,
									'foo-3': 3,
								},
							},
						]);

						fulfill(true);
					} catch (err) {
						reject(err);
					}
				}
			);
		});
	});
});
