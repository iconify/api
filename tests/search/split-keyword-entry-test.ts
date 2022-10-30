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
		).toEqual({
			searches: [
				{
					keywords: ['home'],
				},
			],
		});

		expect(
			splitKeywordEntries(['home'], {
				prefix: true,
				partial: false,
			})
		).toEqual({
			searches: [
				{
					keywords: ['home'],
				},
			],
		});

		expect(
			splitKeywordEntries(['home'], {
				prefix: true,
				partial: true,
			})
		).toEqual({
			searches: [
				{
					keywords: [],
				},
			],
			partial: 'home',
		});
	});

	test('Multiple simple entries', () => {
		expect(
			splitKeywordEntries(['mdi', 'home'], {
				prefix: false,
				partial: false,
			})
		).toEqual({
			searches: [
				{
					keywords: ['mdi', 'home'],
				},
			],
		});

		expect(
			splitKeywordEntries(['mdi', 'home'], {
				prefix: true,
				partial: false,
			})
		).toEqual({
			searches: [
				{
					prefix: 'mdi',
					keywords: ['home'],
				},
				{
					keywords: ['mdi', 'home'],
				},
			],
		});

		expect(
			splitKeywordEntries(['mdi', 'home'], {
				prefix: true,
				partial: true,
			})
		).toEqual({
			searches: [
				{
					prefix: 'mdi',
					keywords: [],
				},
				{
					keywords: ['mdi'],
				},
			],
			partial: 'home',
		});
	});

	test('Incomplete prefix', () => {
		expect(
			splitKeywordEntries(['mdi-', 'home'], {
				prefix: false,
				partial: false,
			})
		).toEqual({
			searches: [
				{
					keywords: ['mdi', 'home'],
					test: ['mdi-'],
				},
			],
		});

		expect(
			splitKeywordEntries(['mdi-', 'home'], {
				prefix: true,
				partial: false,
			})
		).toEqual({
			searches: [
				{
					prefix: 'mdi-',
					keywords: ['home'],
				},
				{
					keywords: ['mdi', 'home'],
					test: ['mdi-'],
				},
			],
		});

		expect(
			splitKeywordEntries(['mdi-', 'home'], {
				prefix: true,
				partial: true,
			})
		).toEqual({
			searches: [
				{
					prefix: 'mdi-',
					keywords: [],
				},
				{
					keywords: ['mdi'],
					test: ['mdi-'],
				},
			],
			partial: 'home',
		});
	});

	test('Long entry', () => {
		expect(
			splitKeywordEntries(['mdi-home-outline'], {
				prefix: false,
				partial: false,
			})
		).toEqual({
			searches: [
				{
					keywords: ['mdi', 'home', 'outline'],
					test: ['mdi-home-outline'],
				},
			],
		});

		expect(
			splitKeywordEntries(['mdi-home-outline'], {
				prefix: true,
				partial: false,
			})
		).toEqual({
			searches: [
				{
					prefix: 'mdi',
					keywords: ['home', 'outline'],
					test: ['home-outline'],
				},
				{
					keywords: ['mdi', 'home', 'outline'],
					test: ['mdi-home-outline'],
				},
			],
		});

		expect(
			splitKeywordEntries(['mdi-home-outline'], {
				prefix: true,
				partial: true,
			})
		).toEqual({
			searches: [
				{
					prefix: 'mdi',
					keywords: ['home'],
					test: ['home-outline'],
				},
				{
					keywords: ['mdi', 'home'],
					test: ['mdi-home-outline'],
				},
			],
			partial: 'outline',
		});
	});

	test('Complex entries', () => {
		expect(
			splitKeywordEntries(['mdi-light', 'arrow-left'], {
				prefix: false,
				partial: false,
			})
		).toEqual({
			searches: [
				{
					keywords: ['mdi', 'light', 'arrow', 'left'],
					test: ['mdi-light', 'arrow-left'],
				},
			],
		});

		expect(
			splitKeywordEntries(['mdi-light', 'arrow-left'], {
				prefix: true,
				partial: false,
			})
		).toEqual({
			searches: [
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
			],
		});

		expect(
			splitKeywordEntries(['mdi-light', 'arrow-left'], {
				prefix: false,
				partial: true,
			})
		).toEqual({
			searches: [
				{
					keywords: ['mdi', 'light', 'arrow'],
					test: ['mdi-light', 'arrow-left'],
				},
			],
			partial: 'left',
		});

		expect(
			splitKeywordEntries(['mdi-light', 'arrow-left'], {
				prefix: true,
				partial: true,
			})
		).toEqual({
			searches: [
				{
					prefix: 'mdi-light',
					keywords: ['arrow'],
					test: ['arrow-left'],
				},
				{
					prefix: 'mdi',
					keywords: ['light', 'arrow'],
					test: ['arrow-left'],
				},
				{
					keywords: ['mdi', 'light', 'arrow'],
					test: ['mdi-light', 'arrow-left'],
				},
			],
			partial: 'left',
		});
	});
});
