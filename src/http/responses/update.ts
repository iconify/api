import type { FastifyReply, FastifyRequest } from 'fastify';
import { appConfig } from '../../config/app.js';
import { triggerIconSetsUpdate } from '../../data/icon-sets.js';
import { runWhenLoaded } from '../../data/loading.js';

let pendingUpdate = false;
let lastError = 0;

const envKey = 'APP_UPDATE_SECRET';

function logError(msg: string) {
	const time = Date.now();

	// Do not log error too often
	if (time > lastError + 3600000) {
		lastError = time;
		console.error(msg);
	}
}

function checkKey(query: Record<string, string>): boolean {
	if (appConfig.updateRequiredParam) {
		const expectedValue = process.env[envKey];
		if (!expectedValue) {
			// Missing env variable
			logError(`Cannot process update request: missing env variable "${envKey}"`);
			return false;
		}

		const value = query[appConfig.updateRequiredParam];
		if (value !== expectedValue) {
			return false;
		}

		// Success
		return true;
	}

	// No param
	logError(
		'Auto-update can be triggered by anyone. Set `updateRequiredParam` config or UPDATE_REQUIRED_PARAM env variable to require secret to trigger update'
	);
	return true;
}

/**
 * Generate icons data
 */
export function generateUpdateResponse(query: FastifyRequest['query'], res: FastifyReply) {
	if (appConfig.allowUpdate && checkKey((query || {}) as Record<string, string>) && !pendingUpdate) {
		pendingUpdate = true;
		runWhenLoaded(() => {
			const delay = appConfig.updateThrottle;
			console.log('Will check for update in', delay, 'seconds...');
			setTimeout(() => {
				triggerIconSetsUpdate();
				pendingUpdate = false;
			}, delay * 1000);
		});
	}

	// Send same message regardless of status
	res.send('ok');
}
