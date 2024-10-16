export function errorText(code: number) {
	switch (code) {
		case 404:
			return 'Not found';

		case 400:
			return 'Bad request';
	}
	return 'Internal server error';
}
