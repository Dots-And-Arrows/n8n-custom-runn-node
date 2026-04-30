import type { IDataObject, IExecuteFunctions, IPollFunctions } from 'n8n-workflow';

const BASE_URL = 'https://api.runn.io';

/**
 * Make an authenticated request to the Runn API.
 *
 * GET requests are automatically paginated using the cursor returned by the API.
 * The full list of results is returned once all pages are fetched.
 *
 * For single-resource GET endpoints (e.g. /people/{id}) the API returns a plain
 * object instead of { values, nextCursor }, which is detected and returned directly.
 *
 * Non-GET requests make a single request and return the response body.
 */
export async function runnApiRequest(
	this: IExecuteFunctions | IPollFunctions,
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
	endpoint: string,
	body?: IDataObject,
	qs?: IDataObject,
): Promise<IDataObject | IDataObject[]> {
	// Bind the execution context so httpRequestWithAuthentication receives the
	// correct `this` (it requires IAllExecuteFunctions; both IExecuteFunctions and
	// IPollFunctions satisfy that constraint as union members).
	const httpRequest = this.helpers.httpRequestWithAuthentication.bind(this);

	if (method !== 'GET') {
		const response = await httpRequest('runnApi', {
			method,
			url: `${BASE_URL}${endpoint}`,
			body,
			json: true,
		});
		return (response ?? {}) as IDataObject;
	}

	// GET: handle cursor-based pagination
	const results: IDataObject[] = [];
	let cursor: string | undefined;

	do {
		const response = (await httpRequest('runnApi', {
			method: 'GET',
			url: `${BASE_URL}${endpoint}`,
			qs: { limit: 200, ...qs, ...(cursor ? { cursor } : {}) },
			json: true,
		})) as IDataObject;

		if (response && Array.isArray(response.values)) {
			results.push(...(response.values as IDataObject[]));
			cursor = response.nextCursor as string | undefined;
		} else {
			// Single-item endpoint — return the object directly
			return (response ?? {}) as IDataObject;
		}
	} while (cursor);

	return results;
}
