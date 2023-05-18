import { splitKeywordEntries } from '../../lib/data/search/split';

describe('Splitting keywords', () => {
	test('Bad entries', () => {
		expect(
			splitKeywordEntries(['home?'], {
				prefix: false,
				partial: false,
			})
		).toBeUndefined();

		expect(
			splitKeywordEntries(['bad_stuff'], {
				prefix: false,
				partial: false,
			})
		).toBeUndefined();

		expect(
			splitKeywordEntries([], {
				prefix: false,
				partial: false,
			})
		).toBeUndefined();

		expect(
			splitKeywordEntries(['mdi', ''], {
				prefix: false,
				partial: false,
			})
		).toBeUndefined();
	});

	test('Simple entry', () => {
		expect(
			splitKeywordEntries(['home'], {
				prefix: false,
				partial: false,
			})
		).toEqual([
			{
				keywords: ['home'],
			},
		]);

		expect(
			splitKeywordEntries(['home'], {
				prefix: true,
				partial: false,
			})
		).toEqual([
			{
				keywords: ['home'],
			},
		]);

		expect(
			splitKeywordEntries(['home'], {
				prefix: true,
				partial: true,
			})
		).toEqual([
			{
				keywords: [],
				partial: 'home',
			},
		]);
	});

	test('Multiple simple entries', () => {
		expect(
			splitKeywordEntries(['mdi', 'home'], {
				prefix: false,
				partial: false,
			})
		).toEqual([
			{
				keywords: ['mdi', 'home'],
			},
			{
				keywords: ['mdihome'],
			},
		]);

		expect(
			splitKeywordEntries(['mdi', 'home', 'outline'], {
				prefix: false,
				partial: false,
			})
		).toEqual([
			{
				keywords: ['mdi', 'home', 'outline'],
			},
			{
				keywords: ['mdihome', 'outline'],
			},
			{
				keywords: ['mdihomeoutline'],
			},
			{
				keywords: ['mdi', 'homeoutline'],
			},
		]);

		expect(
			splitKeywordEntries(['mdi', 'home'], {
				prefix: true,
				partial: false,
			})
		).toEqual([
			{
				prefix: 'mdi',
				keywords: ['home'],
			},
			{
				keywords: ['mdi', 'home'],
			},
			{
				keywords: ['mdihome'],
			},
		]);

		expect(
			splitKeywordEntries(['mdi', 'home'], {
				prefix: true,
				partial: true,
			})
		).toEqual([
			{
				prefix: 'mdi',
				keywords: [],
				partial: 'home',
			},
			{
				keywords: ['mdi'],
				partial: 'home',
			},
			{
				keywords: [],
				partial: 'mdihome',
			},
		]);
	});

	test('Incomplete prefix', () => {
		expect(
			splitKeywordEntries(['mdi-', 'home'], {
				prefix: false,
				partial: false,
			})
		).toEqual([
			{
				keywords: ['mdi', 'home'],
				test: ['mdi-'],
			},
		]);

		expect(
			splitKeywordEntries(['mdi-', 'home'], {
				prefix: true,
				partial: false,
			})
		).toEqual([
			{
				prefix: 'mdi-',
				keywords: ['home'],
			},
			{
				keywords: ['mdi', 'home'],
				test: ['mdi-'],
			},
		]);

		expect(
			splitKeywordEntries(['mdi-', 'home'], {
				prefix: true,
				partial: true,
			})
		).toEqual([
			{
				prefix: 'mdi-',
				keywords: [],
				partial: 'home',
			},
			{
				keywords: ['mdi'],
				partial: 'home',
				test: ['mdi-'],
			},
		]);
	});

	test('Long entry', () => {
		expect(
			splitKeywordEntries(['mdi-home-outline'], {
				prefix: false,
				partial: false,
			})
		).toEqual([
			{
				keywords: ['mdi', 'home', 'outline'],
				test: ['mdi-home-outline'],
			},
		]);

		expect(
			splitKeywordEntries(['mdi-home-outline'], {
				prefix: true,
				partial: false,
			})
		).toEqual([
			{
				prefix: 'mdi',
				keywords: ['home', 'outline'],
				test: ['home-outline'],
			},
			{
				keywords: ['mdi', 'home', 'outline'],
				test: ['mdi-home-outline'],
			},
		]);

		expect(
			splitKeywordEntries(['mdi-home-outline'], {
				prefix: true,
				partial: true,
			})
		).toEqual([
			{
				prefix: 'mdi',
				keywords: ['home'],
				partial: 'outline',
				test: ['home-outline'],
			},
			{
				keywords: ['mdi', 'home'],
				partial: 'outline',
				test: ['mdi-home-outline'],
			},
		]);
	});

	test('Complex entries', () => {
		expect(
			splitKeywordEntries(['mdi-light', 'arrow-left'], {
				prefix: false,
				partial: false,
			})
		).toEqual([
			{
				keywords: ['mdi', 'light', 'arrow', 'left'],
				test: ['mdi-light', 'arrow-left'],
			},
		]);

		expect(
			splitKeywordEntries(['mdi-light', 'arrow-left'], {
				prefix: true,
				partial: false,
			})
		).toEqual([
			{
				prefix: 'mdi-light',
				keywords: ['arrow', 'left'],
				test: ['arrow-left'],
			},
			{
				prefix: 'mdi',
				keywords: ['light', 'arrow', 'left'],
				test: ['arrow-left'],
			},
			{
				keywords: ['mdi', 'light', 'arrow', 'left'],
				test: ['mdi-light', 'arrow-left'],
			},
		]);

		expect(
			splitKeywordEntries(['mdi-light', 'arrow-left'], {
				prefix: false,
				partial: true,
			})
		).toEqual([
			{
				keywords: ['mdi', 'light', 'arrow'],
				partial: 'left',
				test: ['mdi-light', 'arrow-left'],
			},
		]);

		expect(
			splitKeywordEntries(['mdi-light', 'arrow-left'], {
				prefix: true,
				partial: true,
			})
		).toEqual([
			{
				prefix: 'mdi-light',
				keywords: ['arrow'],
				partial: 'left',
				test: ['arrow-left'],
			},
			{
				prefix: 'mdi',
				keywords: ['light', 'arrow'],
				partial: 'left',
				test: ['arrow-left'],
			},
			{
				keywords: ['mdi', 'light', 'arrow'],
				partial: 'left',
				test: ['mdi-light', 'arrow-left'],
			},
		]);
	});
});
