/**
 * Field and operation definitions for the Contracts resource.
 * Exports contractsOperations (the operation dropdown) and contractsFields (all input fields).
 * Each field uses displayOptions to show only for the correct resource + operation combination.
 */
import { INodeProperties } from 'n8n-workflow';

export const contractsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		// eslint-disable-next-line n8n-nodes-base/node-param-default-missing
		default: 'fetchAllContracts',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['contracts'],
			},
		},
		options: [
			{
				name: 'Get All',
				value: 'fetchAllContracts',
				description: 'Get all contracts',
				action: 'Get all contracts',
			},
		],
	},
];

export const contractsFields: INodeProperties[] = [
	// ----------------------------------------
	//     contracts: fetchAllContracts
	// ----------------------------------------
	{
		displayName: 'Modified After',
		name: 'modifiedAfter',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['contracts'],
				operation: ['fetchAllContracts'],
			},
		},
		default: '',
		description: 'Return only contracts modified after this date',
	},
	{
		displayName: 'Sort By',
		name: 'sortBy',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['contracts'],
				operation: ['fetchAllContracts'],
			},
		},
		options: [
			{
				name: 'Created At',
				value: 'createdAt',
			},
			{
				name: 'ID',
				value: 'id',
			},
			{
				name: 'Updated At',
				value: 'updatedAt',
			},
		],
		default: 'id',
		description: 'Field to sort results by',
	},
	{
		displayName: 'Order',
		name: 'order',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['contracts'],
				operation: ['fetchAllContracts'],
			},
		},
		options: [
			{
				name: 'Ascending',
				value: 'asc',
			},
			{
				name: 'Descending',
				value: 'desc',
			},
		],
		default: 'asc',
		description: 'Sort order for results',
	},
];
