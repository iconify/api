import type { IconifyJSON } from '@iconify/types';

/**
 * Removes bad aliases
 */
export function removeBadAliases(data: IconifyJSON) {
	const icons = data.icons;
	const aliases = data.aliases || {};

	const tested: Set<string> = new Set();
	const failed: Set<string> = new Set();

	function resolve(name: string): boolean {
		if (icons[name]) {
			return true;
		}

		if (!tested.has(name)) {
			// Temporary mark as failed if parent alias points to this alias to avoid infinite loop
			tested.add(name);
			failed.add(name);

			// Get parent icon name and resolve it
			const parent = aliases[name]?.parent;
			if (parent && resolve(parent)) {
				failed.delete(name);
			}
		}

		return !failed.has(name);
	}

	// Resolve aliases
	const keys = Object.keys(aliases);
	for (let i = 0; i < keys.length; i++) {
		resolve(keys[i]);
	}

	// Remove failed aliases
	failed.forEach((name) => {
		delete aliases[name];
	});
}
