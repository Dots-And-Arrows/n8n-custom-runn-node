import { INodeProperties } from 'n8n-workflow';

export const actualsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		// eslint-disable-next-line n8n-nodes-base/node-param-default-missing
		default: 'fetchAllActuals',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['actuals'],
			},
		},
		options: [
			{
				name: 'Create or Update',
				value: 'createOrUpdateActual',
				description: 'Create or update an actual. Overwrites any existing actual for the same date, person, project, role, and workstream.',
				action: 'Create or update an actual',
			},
			{
				name: 'Delete',
				value: 'deleteActual',
				description: 'Delete an actual by ID',
				action: 'Delete an actual',
			},
			{
				name: 'Get All',
				value: 'fetchAllActuals',
				description: 'Get all actuals',
				action: 'Get all actuals',
			},
		],
	},
];

export const actualsFields: INodeProperties[] = [
	// ----------------------------------------
	//     actuals: createOrUpdateActual
	// ----------------------------------------
	{
		displayName: 'Date',
		name: 'date',
		type: 'dateTime',
		required: true,
		displayOptions: {
			show: {
				resource: ['actuals'],
				operation: ['createOrUpdateActual'],
			},
		},
		default: '',
		description: 'The date this actual is for (YYYY-MM-DD)',
	},
	{
		displayName: 'Person ID',
		name: 'personId',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['actuals'],
				operation: ['createOrUpdateActual'],
			},
		},
		default: '',
		description: 'ID of the person this actual is for',
	},
	{
		displayName: 'Project ID',
		name: 'projectId',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['actuals'],
				operation: ['createOrUpdateActual'],
			},
		},
		default: '',
		description: 'ID of the project this actual is for',
	},
	{
		displayName: 'Role ID',
		name: 'roleId',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['actuals'],
				operation: ['createOrUpdateActual'],
			},
		},
		default: '',
		description: 'ID of the role the person was in for this actual',
	},
	{
		displayName: 'Billable Minutes',
		name: 'billableMinutes',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['actuals'],
				operation: ['createOrUpdateActual'],
			},
		},
		default: 0,
		description: 'Number of billable minutes. Together with Non-Billable Minutes, this represents the total time for the day.',
		typeOptions: {
			minValue: 0,
		},
	},
	{
		displayName: 'Non-Billable Minutes',
		name: 'nonbillableMinutes',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['actuals'],
				operation: ['createOrUpdateActual'],
			},
		},
		default: 0,
		description: 'Number of non-billable minutes. Together with Billable Minutes, this represents the total time for the day.',
		typeOptions: {
			minValue: 0,
		},
	},
	{
		displayName: 'Billable Note',
		name: 'billableNote',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['actuals'],
				operation: ['createOrUpdateActual'],
			},
		},
		default: '',
		description: 'A note about the billable minutes',
	},
	{
		displayName: 'Non-Billable Note',
		name: 'nonbillableNote',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['actuals'],
				operation: ['createOrUpdateActual'],
			},
		},
		default: '',
		description: 'A note about the non-billable minutes',
	},
	{
		displayName: 'Phase ID',
		name: 'phaseId',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['actuals'],
				operation: ['createOrUpdateActual'],
			},
		},
		default: '',
		description: 'ID of the phase this actual belongs to (optional)',
	},
	{
		displayName: 'Workstream ID',
		name: 'workstreamId',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['actuals'],
				operation: ['createOrUpdateActual'],
			},
		},
		default: '',
		description: 'ID of the workstream this actual belongs to (optional)',
	},
	{
		displayName: 'Dry Run',
		name: 'dryRun',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['actuals'],
				operation: ['createOrUpdateActual'],
			},
		},
		description: 'Whether no actual changes will be made to your Runn account. When enabled, it will only simulate the operation.',
	},

	// ----------------------------------------
	//         actuals: deleteActual
	// ----------------------------------------
	{
		displayName: 'Actual ID',
		name: 'actualId',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['actuals'],
				operation: ['deleteActual'],
			},
		},
		default: '',
		description: 'ID of the actual to delete',
	},
	{
		displayName: 'Dry Run',
		name: 'dryRun',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['actuals'],
				operation: ['deleteActual'],
			},
		},
		description: 'Whether no actual changes will be made to your Runn account. When enabled, it will only simulate the operation.',
	},

	// ----------------------------------------
	//         actuals: fetchAllActuals
	// ----------------------------------------
	{
		displayName: 'Modified After',
		name: 'modifiedAfter',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['actuals'],
				operation: ['fetchAllActuals'],
			},
		},
		default: '',
		description: 'Return only actuals modified after this date',
	},
];
