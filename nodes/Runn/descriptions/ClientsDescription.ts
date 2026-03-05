import { INodeProperties } from 'n8n-workflow';

export const clientsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		// eslint-disable-next-line n8n-nodes-base/node-param-default-missing
		default: 'fetchAllClients',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['clients'],
			},
		},
		options: [
			{
				name: 'Archive',
				value: 'archiveClient',
				description: 'Archive a client',
				action: 'Archive a client',
			},
			{
				name: 'Create',
				value: 'createClient',
				description: 'Create a new client',
				action: 'Create a client',
			},
			{
				name: 'Get All',
				value: 'fetchAllClients',
				description: 'Get all clients',
				action: 'Get all clients',
			},
			{
				name: 'Get One',
				value: 'fetchClient',
				description: 'Get a single client',
				action: 'Get a client',
			},
			{
				name: 'Unarchive',
				value: 'unarchiveClient',
				description: 'Unarchive a client',
				action: 'Unarchive a client',
			},
			{
				name: 'Update',
				value: 'updateClient',
				description: 'Update a client',
				action: 'Update a client',
			},
		],
	},
];

export const clientsFields: INodeProperties[] = [
	// ----------------------------------------
	//         clients: fetchAllClients
	// ----------------------------------------
	{
		displayName: 'Only Active',
		name: 'onlyActive',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['clients'],
				operation: ['fetchAllClients'],
			},
		},
		description: 'Whether to return only active clients',
	},

	// ----------------------------------------
	//  clients: fetchClient / update / archive / unarchive
	// ----------------------------------------
	{
		displayName: 'ID',
		name: 'id',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['clients'],
				operation: ['fetchClient', 'updateClient', 'archiveClient', 'unarchiveClient'],
			},
		},
		default: '',
		description: 'ID of the client to operate on',
	},

	// ----------------------------------------
	//         clients: createClient
	// ----------------------------------------
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['clients'],
				operation: ['createClient'],
			},
		},
		default: '',
		description: 'Name of the client',
	},

	// ----------------------------------------
	//         clients: updateClient
	// ----------------------------------------
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['clients'],
				operation: ['updateClient'],
			},
		},
		default: '',
		description: 'Name of the client',
	},

	// ----------------------------------------
	//     clients: createClient / updateClient
	// ----------------------------------------
	{
		displayName: 'Website',
		name: 'website',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['clients'],
				operation: ['createClient', 'updateClient'],
			},
		},
		default: '',
		description: 'Website of the client',
	},

	// ----------------------------------------
	//      clients: all write operations
	// ----------------------------------------
	{
		displayName: 'Dry Run',
		name: 'dryRun',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['clients'],
				operation: ['createClient', 'updateClient', 'archiveClient', 'unarchiveClient'],
			},
		},
		description:
			'Whether no actual changes will be made to your Runn account. When enabled, it will only simulate the operation.',
	},
];
