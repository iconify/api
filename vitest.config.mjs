import { rmSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// Remove tests cache
try {
	rmSync('cache/tests', {
		recursive: true,
	});
} catch {}

// Return config
export default defineConfig({
	test: {
		globals: true,
		watch: false,
		threads: false,
		isolate: false,
		include: ['**/tests/**/*-test.ts'],
	},
});
