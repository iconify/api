import { generateIconSetIconsTree } from '../../lib/data/icon-set/lists/icons';

describe('Icons tree', () => {
	test('Simple icon set', () => {
		const tree = generateIconSetIconsTree({
			prefix: 'foo',
			icons: {
				bar: {
					body: '<g id="bar" />',
				},
				baz: {
					body: '<g id="baz" />',
				},
				foo: {
					body: '<g id="foo" />',
				},
			},
		});

		expect(tree.failed).toEqual(new Set());
		expect(tree.visible).toEqual(new Set(['bar', 'baz', 'foo']));
		expect(tree.hidden).toEqual(new Set());
		expect(tree.visibleAliases).toEqual({});
		expect(tree.hiddenAliases).toEqual({});

		expect(tree.tags).toEqual([]);
		expect(tree.uncategorised).toEqual(['bar', 'baz', 'foo']);
	});

	test('Few aliases', () => {
		const tree = generateIconSetIconsTree({
			prefix: 'foo',
			icons: {
				bar: {
					body: '<g />',
				},
				bar2: {
					body: '<g />',
				},
			},
			aliases: {
				'foo': {
					parent: 'bar',
					hFlip: true,
				},
				'foo2': {
					parent: 'foo',
				},
				'missing-alias': {
					parent: 'missing-icon',
				},
			},
			categories: {
				Bar: ['bar', 'baz'],
			},
		});

		expect(tree.failed).toEqual(new Set(['missing-alias', 'missing-icon']));
		expect(tree.visible).toEqual(new Set(['bar', 'bar2', 'foo']));
		expect(tree.hidden).toEqual(new Set());
		expect(tree.visibleAliases).toEqual({ foo2: 'foo' });
		expect(tree.hiddenAliases).toEqual({});

		expect(tree.tags).toEqual([
			{
				title: 'Bar',
				icons: ['bar', 'foo'],
			},
		]);
		expect(tree.uncategorised).toEqual(['bar2']);
	});

	test('Many aliases', () => {
		const tree = generateIconSetIconsTree({
			prefix: 'foo',
			icons: {
				icon1: {
					body: '<path d="icon1" />',
					width: 20,
					height: 20,
				},
				icon2: {
					body: '<path d="icon2" />',
					width: 24,
					rotate: 1,
					hFlip: true,
					hidden: true,
				},
			},
			aliases: {
				alias2a: {
					// Alias before parent
					parent: 'alias2f',
					width: 20,
					height: 20,
				},
				alias2f: {
					parent: 'icon2',
					width: 22,
					rotate: 1,
					hFlip: true,
					vFlip: true,
				},
				alias2z: {
					// Alias after parent
					parent: 'alias2f',
					width: 21,
					rotate: 3,
					// Visible, but parent is hidden
					hidden: false,
				},
				alias2z3: {
					// 3 parents: alias2z, alias2f, icon2
					parent: 'alias2z',
				},
				alias2z4: {
					// 4 parents: alias2z3, alias2z, alias2f, icon2
					parent: 'alias2z3',
				},
				alias2z5: {
					// 5 parents: alias2z4, alias2z3, alias2z, alias2f, icon2
					parent: 'alias2z4',
				},
				alias2z6: {
					// 6 parents: alias2z5, alias2z4, alias2z3, alias2z, alias2f, icon2
					parent: 'alias2z5',
					hidden: true,
				},
				alias2z7: {
					// 7 parents: alias2z6, alias2z5, alias2z4, alias2z3, alias2z, alias2f, icon2
					parent: 'alias2z6',
				},
				alias3: {
					// invalid parent
					parent: 'icon3',
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
			categories: {
				Loop: ['loop1', 'loop2', 'loop3'],
				Icon1: ['icon1'],
				Icon2: ['icon2'],
			},
			height: 24,
		});

		expect(tree.failed).toEqual(new Set(['alias3', 'icon3', 'loop1', 'loop2', 'loop3']));
		expect(tree.visible).toEqual(new Set(['icon1', 'alias2z']));
		expect(tree.hidden).toEqual(new Set(['icon2', 'alias2f', 'alias2a']));
		expect(tree.visibleAliases).toEqual({
			alias2z3: 'alias2z',
			alias2z4: 'alias2z',
			alias2z5: 'alias2z',
		});
		expect(tree.hiddenAliases).toEqual({
			alias2z6: 'alias2z',
			alias2z7: 'alias2z',
		});

		expect(tree.tags).toEqual([
			{
				title: 'Icon1',
				icons: ['icon1'],
			},
			{
				title: 'Icon2',
				icons: ['alias2z'],
			},
		]);
		expect(tree.uncategorised).toEqual([]);
	});
});
