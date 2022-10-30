/**
 * Convert string to boolean
 */
export function paramToBoolean(value: string, defaultValue?: boolean): boolean | undefined {
	switch (value) {
		case 'true':
		case 'yes':
		case '1':
			return true;

		case 'false':
		case 'no':
		case '0':
			return false;
	}

	return defaultValue;
}
