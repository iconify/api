import { generateIconSetIconsTree } from '../../lib/data/icon-set/lists/icons';
import { removeBadIconSetItems } from '../../lib/data/icon-set/lists/validate';

describe('Validating icon set', () => {
	test('Long chain of aliases, bad aliases', () => {
		const body = '<g />';

		const iconSet = {
			prefix: 'foo',
			icons: {
				foo: {
					body,
				},
				bar: {
					body,
				},
			},
			aliases: {
				baz: {
					parent: 'bar',
				},
				// Will be parsed before parent
				baz2: {
					parent: 'baz3',
				},
				// Will be parsed when already resolved
				baz3: {
					parent: 'baz',
				},
				baz4: {
					parent: 'baz3',
				},
				baz5: {
					parent: 'baz4',
				},
				baz6: {
					parent: 'baz5',
				},
				bazz5: {
					parent: 'baz4',
					hFlip: true,
				},
				// Bad alias
				bad: {
					parent: 'good',
				},
				// Loop
				loop1: {
					parent: 'loop3',
				},
				loop2: {
					parent: 'loop1',
				},
				loop3: {
					parent: 'loop1',
				},
			},
		};
		removeBadIconSetItems(iconSet, generateIconSetIconsTree(iconSet));

		// Check aliases
		expect(Object.keys(iconSet.aliases)).toEqual(['baz', 'baz2', 'baz3', 'baz4', 'baz5', 'baz6', 'bazz5']);
	});
});
