import { config } from 'dotenv';
import { parseArgs } from 'node:util';
import {
	connectToSSHWithKeys,
	execSFTPCommandWithShell,
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
		clean: {
			type: 'boolean',
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

// Connect
const client = await connectToSSHWithKeys(ip, 'root', key);
if (!client) {
	throw new Error('Failed to connect to SSH');
}

// Upload all files
await uploadAPIFiles(client);

// Clean up old files
if (params.values.clean) {
	console.log('Cleaning up old files...');
	await execSFTPCommandWithShell(
		client,
		`cd ${baseAppDirectory} && rm -rf cache`
	);
}

// Restart server
console.log('Restarting server...');
const execResult = await execSFTPCommandWithShell(
	client,
	`cd ${baseAppDirectory} && rm -rf node_modules package-lock.json pnpm-lock.yaml && npx pnpm i && pm2 restart all --time`
);

// Close SSH connection
client.end();

if (execResult !== 0) {
	throw new Error(`Failed to restart server, exit code: ${execResult}`);
}
