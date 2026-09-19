import { uploadSFTPFiles, type Client } from '@cyberalien/deploy-utils';
import { scanDirectory } from '@iconify/tools/lib/index.js';
import { readFile } from 'node:fs/promises';
import { baseAppDirectory } from './config.js';

/**
 * Upload API files to the server
 */
export async function uploadAPIFiles(client: Client) {
	// List all files to upload
	const uploadFiles = Object.create(null) as Record<string, string>;

	// Add built files and custom icon sets
	for (const directory of ['lib', 'icons']) {
		for (const file of await scanDirectory(directory)) {
			if (file.endsWith('.d.ts')) {
				// Skip types - not needed on server
				continue;
			}
			const filePath = `${directory}/${file}`;
			uploadFiles[filePath] = await readFile(filePath, 'utf8');
		}
	}

	// Add package.json
	const packageJSON = JSON.parse(await readFile('package.json', 'utf8'));
	delete packageJSON.devDependencies;
	delete packageJSON.packageManager;
	for (const scriptKey in packageJSON.scripts) {
		if (scriptKey !== 'start') {
			delete packageJSON.scripts[scriptKey];
		}
	}
	uploadFiles['package.json'] = JSON.stringify(packageJSON, null, 2);

	// Add .env
	const currentEnv = await readFile('.env', 'utf8');

	let foundPort = false;
	const envLines = currentEnv
		.split('\n')
		.filter(
			(line) =>
				// Empty lines
				line.trim() !== '' &&
				// Comments
				!line.startsWith('#') &&
				// Deploy config
				!line.startsWith('DEPLOY_')
		)
		.map((line) => {
			// Override custom .env values with environment variables, if set
			const chunks = line.split('=');
			if (chunks.length > 1) {
				const key = chunks[0];
				if (key === 'PORT') {
					// Always run on port 80 on server
					foundPort = true;
					return 'PORT=80';
				}
				const customValue = process.env[key];
				if (typeof customValue !== 'undefined') {
					return `${key}=${customValue}`;
				}
			}
			return line;
		});
	if (!foundPort) {
		envLines.unshift('PORT=80');
	}
	uploadFiles['.env'] = envLines.join('\n') + '\n';

	// Upload all files
	await uploadSFTPFiles(client, baseAppDirectory, uploadFiles, 1);
}
