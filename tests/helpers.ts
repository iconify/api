import { readFile } from 'node:fs/promises';
import { parse } from 'dotenv';

/**
 * Load fixture
 */
export async function loadFixture(file: string): Promise<string> {
	return await readFile('tests/fixtures/' + file, 'utf8');
}

// Counter
let uniqueDirCounter = Date.now();

/**
 * Get unique cache directory
 */
export function uniqueCacheDir(): string {
	// Return unique dir
	return 'tests/dir-' + (uniqueDirCounter++).toString();
}

/**
 * Await
 */
export function awaitTick(): Promise<undefined> {
	return new Promise((fulfill, reject) => {
		setTimeout(() => {
			fulfill(void 0);
		});
	});
}

/**
 * Get env variable
 */
export async function getEnv(key: string): Promise<string | undefined> {
	const files = ['.env.test', '.env.dev', '.env'];
	for (let i = 0; i < files.length; i++) {
		try {
			const contents = await readFile(files[i]);
			const env = parse(contents);
			if (env[key] !== void 0) {
				return env[key];
			}
		} catch {}
	}
}
