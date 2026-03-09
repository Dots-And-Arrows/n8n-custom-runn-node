import { INodeProperties } from 'n8n-workflow';

export const assignmentsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		// eslint-disable-next-line n8n-nodes-base/node-param-default-missing
		default: 'fetchAllAssignments',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['assignments'],
			},
		},
		options: [
			{
				name: 'Get All',
				value: 'fetchAllAssignments',
				description: 'Get all assignments',
				action: 'Get all assignments',
			},
		],
	},
];

export const assignmentsFields: INodeProperties[] = [
	// ----------------------------------------
	//     assignments: fetchAllAssignments
	// ----------------------------------------
	{
		displayName: 'Only Active',
		name: 'onlyActive',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['fetchAllAssignments'],
			},
		},
		description: 'Whether to return only active assignments (excludes placeholders and templates)',
	},
	{
		displayName: 'Person ID',
		name: 'personId',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['fetchAllAssignments'],
			},
		},
		default: '',
		description: 'Filter assignments by person ID',
	},
	{
		displayName: 'Project ID',
		name: 'projectId',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['fetchAllAssignments'],
			},
		},
		default: '',
		description: 'Filter assignments by project ID',
	},
	{
		displayName: 'Role ID',
		name: 'roleId',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['fetchAllAssignments'],
			},
		},
		default: '',
		description: 'Filter assignments by role ID',
	},
	{
		displayName: 'Start Date',
		name: 'startDate',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['fetchAllAssignments'],
			},
		},
		default: '',
		description: 'Return only assignments starting on or after this date (YYYY-MM-DD)',
	},
	{
		displayName: 'End Date',
		name: 'endDate',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['fetchAllAssignments'],
			},
		},
		default: '',
		description: 'Return only assignments ending on or before this date (YYYY-MM-DD)',
	},
	{
		displayName: 'Modified After',
		name: 'modifiedAfter',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['fetchAllAssignments'],
			},
		},
		default: '',
		description: 'Return only assignments modified after this date',
	},
];
