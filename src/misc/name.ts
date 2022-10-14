interface SplitIconName {
	prefix: string;
	name: string;
}

// 2 part icon name
export const iconNameRouteRegEx = '^[a-z0-9-]+:?[a-z0-9-]+$';

// 1 part of icon name
export const iconNameRoutePartialRegEx = '^[a-z0-9-]+$';

/**
 * Split icon name
 */
export function splitIconName(value: string): SplitIconName | undefined {
	let parts = value.split(/[/:]/);
	if (parts.length === 2) {
		return {
			prefix: parts[0],
			name: parts[1],
		};
	}

	parts = value.split('-');
	if (parts.length > 1) {
		return {
			prefix: parts.shift() as string,
			name: parts.join('-'),
		};
	}
}
