/**
 * Field and operation definitions for the Time Offs resource.
 * Exports timeOffsOperations (the operation dropdown) and timeOffsFields (all input fields).
 * Each field uses displayOptions to show only for the correct resource + operation combination.
 */
import { INodeProperties } from 'n8n-workflow';

export const timeOffsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		// eslint-disable-next-line n8n-nodes-base/node-param-default-missing
		default: 'fetchAllLeave',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['timeOffs'],
			},
		},
		options: [
			{
				name: 'Create Leave',
				value: 'createLeave',
				description: 'Create a leave time off for a person. Automatically merges overlapping time offs.',
				action: 'Create a leave time off',
			},
			{
				name: 'Get All Leave',
				value: 'fetchAllLeave',
				description: 'Get all leave time offs',
				action: 'Get all leave time offs',
			},
		],
	},
];

export const timeOffsFields: INodeProperties[] = [
	// ----------------------------------------
	//       timeOffs: createLeave
	// ----------------------------------------
	{
		displayName: 'Person ID',
		name: 'personId',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['timeOffs'],
				operation: ['createLeave'],
			},
		},
		default: '',
		description: 'ID of the person this time off is for',
	},
	{
		displayName: 'Start Date',
		name: 'startDate',
		type: 'dateTime',
		required: true,
		displayOptions: {
			show: {
				resource: ['timeOffs'],
				operation: ['createLeave'],
			},
		},
		default: '',
		description: 'Start date of the time off (YYYY-MM-DD)',
	},
	{
		displayName: 'End Date',
		name: 'endDate',
		type: 'dateTime',
		required: true,
		displayOptions: {
			show: {
				resource: ['timeOffs'],
				operation: ['createLeave'],
			},
		},
		default: '',
		description: 'End date of the time off (YYYY-MM-DD)',
	},
	{
		displayName: 'Minutes Per Day',
		name: 'minutesPerDay',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['timeOffs'],
				operation: ['createLeave'],
			},
		},
		default: '',
		description: 'Minutes per day taken as time off. Omit for a full-day time off as per the person\'s contract. Minimum: 15.',
		typeOptions: {
			minValue: 15,
		},
	},
	{
		displayName: 'Note',
		name: 'note',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['timeOffs'],
				operation: ['createLeave'],
			},
		},
		default: '',
		description: 'A note or comment about the time off',
	},
	{
		displayName: 'Dry Run',
		name: 'dryRun',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['timeOffs'],
				operation: ['createLeave'],
			},
		},
		description: 'Whether no actual changes will be made to your Runn account. When enabled, it will only simulate the operation.',
	},

	// ----------------------------------------
	//       timeOffs: fetchAllLeave
	// ----------------------------------------
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['timeOffs'],
				operation: ['fetchAllLeave'],
			},
		},
		options: [
			{
				displayName: 'End Date',
				name: 'endDate',
				type: 'dateTime',
				default: '',
				description: 'Return only time offs ending on or before this date',
			},
			{
				displayName: 'Modified After',
				name: 'modifiedAfter',
				type: 'dateTime',
				default: '',
				description: 'Return only time offs modified after this date',
			},
			{
				displayName: 'Order',
				name: 'order',
				type: 'options',
				options: [
					{ name: 'Ascending', value: 'asc' },
					{ name: 'Descending', value: 'desc' },
				],
				default: 'asc',
				description: 'Sort order for results',
			},
			{
				displayName: 'Person ID',
				name: 'personId',
				type: 'number',
				default: '',
				description: 'Filter by person ID',
			},
			{
				displayName: 'Sort By',
				name: 'sortBy',
				type: 'options',
				options: [
					{ name: 'Created At', value: 'createdAt' },
					{ name: 'ID', value: 'id' },
					{ name: 'Updated At', value: 'updatedAt' },
				],
				default: 'id',
				description: 'Field to sort results by',
			},
			{
				displayName: 'Start Date',
				name: 'startDate',
				type: 'dateTime',
				default: '',
				description: 'Return only time offs starting on or after this date',
			},
		],
	},
];
