import { readFile } from 'node:fs/promises';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { appConfig } from '../../config/app';

let version: string | undefined;

/**
 * Get version
 */
export async function initVersionResponse() {
	try {
		const packageContent = JSON.parse(await readFile('package.json', 'utf8'));
		if (typeof packageContent.version === 'string') {
			version = packageContent.version;
		}
	} catch {}
}

/**
 * Send response
 */
export function versionResponse(query: FastifyRequest['query']): string {
	return (
		'Iconify API' +
		(version ? ' version ' + version : '') +
		(appConfig.statusRegion ? ' (' + appConfig.statusRegion + ')' : '')
	);
}
