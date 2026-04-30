import type { IAuthenticate, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class RunnApi implements ICredentialType {
	name = 'runnApi';
	displayName = 'Runn API';
	documentationUrl = 'https://help.runn.io/en/articles/7039247-how-to-generate-an-api-token-in-runn';
	description = 'Authentication for Runn.io - a resource planning and forecasting tool';
	icon = 'file:runn.png' as const;

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your Runn API key. Generate one in Runn under Settings → API.',
		},
	];

	// Injects the Bearer token into every request made via httpRequestWithAuthentication
	authenticate: IAuthenticate = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{ "Bearer " + $credentials.apiKey }}',
				accept: 'application/json',
				'accept-version': '1.0.0',
			},
		},
	};

	// When a user saves credentials in n8n, this request is made to verify
	// the API key is valid. A 200 response shows the green "connection tested" badge.
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.runn.io',
			url: '/people?limit=1',
			method: 'GET',
			headers: {
				Authorization: '={{ "Bearer " + $credentials.apiKey }}',
				accept: 'application/json',
				'accept-version': '1.0.0',
			},
		},
	};
}
