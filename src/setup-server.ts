import { config } from 'dotenv';
import { parseArgs } from 'node:util';
import {
	execSFTPCommandWithShell,
	getPM2Status,
	installNodeServer,
	installNpmPackages,
	startPM2Process,
} from '@cyberalien/deploy-utils/lib/index.js';
import { uploadAPIFiles } from './setup/upload.js';
import { baseAppDirectory } from './setup/config.js';

config();

// Get IP
const params = parseArgs({
	options: {
		ip: {
			type: 'string',
		},
	},
	tokens: true,
	allowPositionals: true,
});
const ip = params.values.ip;
if (typeof ip !== 'string') {
	throw new Error(
		'IP address is required. Please provide a valid IP using --ip or as the first argument.'
	);
}

// Get access key
const key = process.env.DEPLOY_KEY_FILE;
if (typeof key !== 'string') {
	throw new Error(
		'Access key is required. Please set the DEPLOY_KEY_FILE environment variable.'
	);
}
const passphrase = process.env.DEPLOY_KEY_PASS ?? '';

// Install server
await installNodeServer({
	ip,
	key,
	passphrase,
	// skipInstall: true,
	install: async (client) => {
		const targetDir = baseAppDirectory;
		const fail = (msg: string) => {
			client.end();
			throw new Error(msg);
		};

		// Stop PM2 processes, if any are running
		const pm2Status = await getPM2Status(client);
		if (pm2Status && pm2Status.length) {
			await execSFTPCommandWithShell(client, 'pm2 stop all && pm2 delete all');
		}

		// Upload all files
		await uploadAPIFiles(client);

		// Install dependencies
		const installResult = await installNpmPackages(client, targetDir, {
			mode: 'prod',
			build: false,
			testFile: 'lib/index.js',
		});
		if (!installResult) {
			fail('Failed to install NPM packages');
		}

		// Start app
		const startResult = await startPM2Process(client, {
			cwd: targetDir,
			cmd: 'npm run start',
			name: 'api',
		});
		if (!startResult) {
			fail('Failed to start PM2 process');
		}
	},
});

console.log('Done!');
