import type { IconStyle } from '../../../types/icon-set/extra.js';

function getValues(body: string, prop: string): string[] {
	const chunks = body.split(prop + '="');
	chunks.shift();
	return chunks.map((item) => {
		const index = item.indexOf('"');
		return index > 0 ? item.slice(0, index) : '';
	});
}

function hasValues(body: string, prop: string): boolean {
	const fills = getValues(body, prop);
	for (let i = 0; i < fills.length; i++) {
		switch (fills[i].toLowerCase()) {
			case '':
			case 'none':
			case 'transparent':
			case 'inherit':
				break;

			default:
				return true;
		}
	}

	return false;
}

/**
 * Check if icon uses fill or stroke
 *
 * Returns null on failure
 */
export function getIconStyle(body: string): IconStyle | null {
	const hasStroke = hasValues(body, 'stroke');
	const hasFill = hasValues(body, 'fill');
	return hasStroke ? (hasFill ? null : 'stroke') : hasFill ? 'fill' : null;
}
