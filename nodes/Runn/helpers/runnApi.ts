import { IExecuteFunctions, ITriggerFunctions } from 'n8n-workflow';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @n8n/community-nodes/no-restricted-imports
const RunnApiClient = require('runn-api-client');

/**
 * Initialize and return the Runn API client using stored credentials.
 *
 * @param this - n8n execution context (IExecuteFunctions or ITriggerFunctions)
 * @returns Initialized Runn API client instance
 */
export async function getRunnApi(this: IExecuteFunctions | ITriggerFunctions) {
	const credentials = await this.getCredentials('runnApi');
	return new RunnApiClient(credentials.apiKey as string, {
		logLevel: 'error',
	});
}
