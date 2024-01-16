import { appConfig, splitIconSetConfig, storageConfig } from '../config/app.js';
import { paramToBoolean } from './bool.js';

interface ConfigurableItem {
	config: unknown;
	prefix: string;
}

const config: ConfigurableItem[] = [
	{
		config: appConfig,
		prefix: '',
	},
	{
		config: splitIconSetConfig,
		prefix: 'SPLIT_',
	},
	{
		config: storageConfig,
		prefix: 'STORAGE_',
	},
];

/**
 * Load config from environment
 */
export function loadEnvConfig(env = process.env) {
	config.forEach(({ config, prefix }) => {
		const cfg = config as Record<string, unknown>;
		for (const key in cfg) {
			const envKey = prefix + key.replace(/[A-Z]/g, (letter) => '_' + letter.toLowerCase()).toUpperCase();
			const value = env[envKey];
			if (value !== void 0) {
				const defaultValue = cfg[key];
				switch (typeof defaultValue) {
					case 'boolean': {
						cfg[key] = paramToBoolean(value.toLowerCase(), cfg[key] as boolean);
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
				}
			}
		}
	});
}
