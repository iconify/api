import { splitKeyword } from '../../lib/data/search/split';

describe('Splitting keywords', () => {
	test('Bad entries', () => {
		expect(splitKeyword('')).toBeUndefined();
		expect(splitKeyword('-')).toBeUndefined();
		expect(splitKeyword('prefix:mdi')).toBeUndefined();
		expect(splitKeyword('palette=true')).toBeUndefined();
		expect(splitKeyword('bad,entry')).toBeUndefined();

		// Too many prefix entries
		expect(splitKeyword('mdi:home mdi-light:home')).toBeUndefined();
	});

	test('Prefixes', () => {
		// 'mdi-home'
		expect(splitKeyword('mdi-home')).toEqual({
			searches: [
				{
					prefixes: ['mdi'],
					prefix: 'mdi', // leftover from internal function
					keywords: [],
					partial: 'home',
				},
				{
					keywords: ['mdi'],
					partial: 'home',
					test: ['mdi-home'],
				},
			],
			params: {},
		});
		expect(splitKeyword('mdi-home', false)).toEqual({
			searches: [
				{
					prefixes: ['mdi'],
					prefix: 'mdi', // leftover from internal function
					keywords: ['home'],
				},
				{
					keywords: ['mdi', 'home'],
					test: ['mdi-home'],
				},
			],
			params: {},
		});

		// 'mdi:home'
		expect(splitKeyword('mdi:home')).toEqual({
			searches: [
				{
					prefixes: ['mdi'],
					keywords: [],
					partial: 'home',
				},
			],
			params: {},
		});
		expect(splitKeyword('mdi:home', false)).toEqual({
			searches: [
				{
					prefixes: ['mdi'],
					keywords: ['home'],
				},
			],
			params: {},
		});

		// 'prefix:mdi home'
		expect(splitKeyword('prefix:mdi home')).toEqual({
			searches: [
				{
					prefixes: ['mdi'],
					keywords: [],
					partial: 'home',
				},
			],
			params: {},
		});
		expect(splitKeyword('prefix:mdi home', false)).toEqual({
			searches: [
				{
					prefixes: ['mdi'],
					keywords: ['home'],
				},
			],
			params: {},
		});

		// 'prefix=mdi home'
		expect(splitKeyword('prefix=mdi home')).toEqual({
			searches: [
				{
					prefixes: ['mdi'],
					keywords: [],
					partial: 'home',
				},
			],
			params: {},
		});
		expect(splitKeyword('prefix=mdi home', false)).toEqual({
			searches: [
				{
					prefixes: ['mdi'],
					keywords: ['home'],
				},
			],
			params: {},
		});

		// 'prefixes:mdi home'
		expect(splitKeyword('prefixes:mdi home')).toEqual({
			searches: [
				{
					prefixes: ['mdi'],
					keywords: [],
					partial: 'home',
				},
			],
			params: {},
		});
		expect(splitKeyword('prefixes:mdi home', false)).toEqual({
			searches: [
				{
					prefixes: ['mdi'],
					keywords: ['home'],
				},
			],
			params: {},
		});

		// 'prefixes:fa6-,mdi- home'
		expect(splitKeyword('prefixes:fa6-,mdi- home')).toEqual({
			searches: [
				{
					prefixes: ['fa6-', 'mdi-'],
					keywords: [],
					partial: 'home',
				},
			],
			params: {},
		});
		expect(splitKeyword('prefixes:fa6-,mdi- home', false)).toEqual({
			searches: [
				{
					prefixes: ['fa6-', 'mdi-'],
					keywords: ['home'],
				},
			],
			params: {},
		});

		// 'prefixes=mdi* home'
		expect(splitKeyword('prefixes=mdi* home')).toEqual({
			searches: [
				{
					prefixes: ['mdi', 'mdi-'],
					keywords: [],
					partial: 'home',
				},
			],
			params: {},
		});
		expect(splitKeyword('prefixes=mdi* home', false)).toEqual({
			searches: [
				{
					prefixes: ['mdi', 'mdi-'],
					keywords: ['home'],
				},
			],
			params: {},
		});

		// 'mdi-light home'
		expect(splitKeyword('mdi-light home')).toEqual({
			searches: [
				{
					prefixes: ['mdi-light'],
					prefix: 'mdi-light',
					keywords: [],
					partial: 'home',
				},
				{
					prefixes: ['mdi'],
					prefix: 'mdi',
					keywords: ['light'],
					partial: 'home',
				},
				{
					keywords: ['mdi', 'light'],
					test: ['mdi-light'],
					partial: 'home',
				},
			],
			params: {},
		});
		expect(splitKeyword('mdi-light home', false)).toEqual({
			searches: [
				{
					prefixes: ['mdi-light'],
					prefix: 'mdi-light',
					keywords: ['home'],
				},
				{
					prefixes: ['mdi'],
					prefix: 'mdi',
					keywords: ['light', 'home'],
				},
				{
					keywords: ['mdi', 'light', 'home'],
					test: ['mdi-light'],
				},
			],
			params: {},
		});

		// 'mdi-light home-outline'
		expect(splitKeyword('mdi-light home-outline')).toEqual({
			searches: [
				{
					prefixes: ['mdi-light'],
					prefix: 'mdi-light',
					keywords: ['home'],
					partial: 'outline',
					test: ['home-outline'],
				},
				{
					prefixes: ['mdi'],
					prefix: 'mdi',
					keywords: ['light', 'home'],
					partial: 'outline',
					test: ['home-outline'],
				},
				{
					keywords: ['mdi', 'light', 'home'],
					partial: 'outline',
					test: ['mdi-light', 'home-outline'],
				},
			],
			params: {},
		});
		expect(splitKeyword('mdi-light home-outline', false)).toEqual({
			searches: [
				{
					prefixes: ['mdi-light'],
					prefix: 'mdi-light',
					keywords: ['home', 'outline'],
					test: ['home-outline'],
				},
				{
					prefixes: ['mdi'],
					prefix: 'mdi',
					keywords: ['light', 'home', 'outline'],
					test: ['home-outline'],
				},
				{
					keywords: ['mdi', 'light', 'home', 'outline'],
					test: ['mdi-light', 'home-outline'],
				},
			],
			params: {},
		});
	});

	test('Keywords', () => {
		expect(splitKeyword('home palette:true')).toEqual({
			searches: [
				{
					keywords: [],
					partial: 'home',
				},
			],
			params: {
				palette: true,
			},
		});

		expect(splitKeyword('home palette=0')).toEqual({
			searches: [
				{
					keywords: [],
					partial: 'home',
				},
			],
			params: {
				palette: false,
			},
		});

		expect(splitKeyword('home prefixes=mdi*,fa6-')).toEqual({
			searches: [
				{
					prefixes: ['mdi', 'mdi-', 'fa6-'],
					keywords: [],
					partial: 'home',
				},
			],
			params: {},
		});

		expect(splitKeyword('home prefix=mdi palette=1', false)).toEqual({
			searches: [
				{
					prefixes: ['mdi'],
					keywords: ['home'],
				},
			],
			params: {
				palette: true,
			},
		});

		expect(splitKeyword('home style:fill')).toEqual({
			searches: [
				{
					keywords: [],
					partial: 'home',
				},
			],
			params: {
				style: 'fill',
			},
		});

		expect(splitKeyword('home style=stroke')).toEqual({
			searches: [
				{
					keywords: [],
					partial: 'home',
				},
			],
			params: {
				style: 'stroke',
			},
		});

		expect(splitKeyword('home fill=true')).toEqual({
			searches: [
				{
					keywords: [],
					partial: 'home',
				},
			],
			params: {
				style: 'fill',
			},
		});

		expect(splitKeyword('home stroke=true')).toEqual({
			searches: [
				{
					keywords: [],
					partial: 'home',
				},
			],
			params: {
				style: 'stroke',
			},
		});

		// Too short for partial
		expect(splitKeyword('a')).toEqual({
			searches: [
				{
					keywords: ['a'],
				},
			],
			params: {},
		});
	});
});
