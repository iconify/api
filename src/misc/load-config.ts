import { appConfig } from '../config/app';

/**
 * Load config from environment
 */
export function loadEnvConfig(env = process.env) {
	[appConfig].forEach((config) => {
		const cfg = config as unknown as Record<string, unknown>;
		for (const key in cfg) {
			const envKey = key.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase()).toUpperCase();
			const value = env[envKey];
			if (value !== void 0) {
				const defaultValue = cfg[key];
				switch (typeof defaultValue) {
					case 'boolean': {
						const valuelc = value.toLowerCase();
						if (valuelc === 'true' || valuelc === '1') {
							cfg[key] = true;
						} else if (valuelc === 'false' || valuelc === '0') {
							cfg[key] = false;
						}
						break;
					}

					case 'number': {
						const num = parseInt(value);
						if (!isNaN(num)) {
							cfg[key] = num;
						}
						break;
					}

					case 'string':
						cfg[key] = value;
						break;

					case 'object':
						if (defaultValue instanceof Array) {
							// Append one entry to array
							defaultValue.push(value);
						}
				}
			}
		}
	});
}
