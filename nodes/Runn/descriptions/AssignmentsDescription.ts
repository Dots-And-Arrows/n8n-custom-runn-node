/**
 * Field and operation definitions for the Assignments resource.
 * Exports assignmentsOperations (the operation dropdown) and assignmentsFields (all input fields).
 * Each field uses displayOptions to show only for the correct resource + operation combination.
 */
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
				name: 'Create',
				value: 'createAssignment',
				description: 'Create a new assignment',
				action: 'Create an assignment',
			},
			{
				name: 'Delete',
				value: 'deleteAssignment',
				description: 'Delete an assignment by ID',
				action: 'Delete an assignment',
			},
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
	//     assignments: createAssignment
	// ----------------------------------------
	{
		displayName: 'Person ID',
		name: 'personId',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['createAssignment'],
			},
		},
		default: '',
		description: 'ID of the person to assign',
	},
	{
		displayName: 'Project ID',
		name: 'projectId',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['createAssignment'],
			},
		},
		default: '',
		description: 'ID of the project to assign the person to',
	},
	{
		displayName: 'Role ID',
		name: 'roleId',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['createAssignment'],
			},
		},
		default: '',
		description: 'ID of the role the person will have on the project',
	},
	{
		displayName: 'Start Date',
		name: 'startDate',
		type: 'dateTime',
		required: true,
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['createAssignment'],
			},
		},
		default: '',
		description: 'Start date of the assignment (YYYY-MM-DD)',
	},
	{
		displayName: 'End Date',
		name: 'endDate',
		type: 'dateTime',
		required: true,
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['createAssignment'],
			},
		},
		default: '',
		description: 'End date of the assignment (YYYY-MM-DD)',
	},
	{
		displayName: 'Minutes Per Day',
		name: 'minutesPerDay',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['createAssignment'],
			},
		},
		default: 0,
		description: 'Number of minutes per day for this assignment',
		typeOptions: {
			minValue: 0,
		},
	},
	{
		displayName: 'Billable (Optional)',
		name: 'isBillable',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['createAssignment'],
			},
		},
		default: true,
		description: 'Whether the assignment is billable',
	},
	{
		displayName: 'Include Non-Working Days (Optional)',
		name: 'isNonWorkingDay',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['createAssignment'],
			},
		},
		default: false,
		description: 'Whether to include non-working days in the assignment',
	},
	{
		displayName: 'Note (Optional)',
		name: 'note',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['createAssignment'],
			},
		},
		default: '',
		description: 'A note about this assignment',
	},
	{
		displayName: 'Phase ID (Optional)',
		name: 'phaseId',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['createAssignment'],
			},
		},
		default: '',
		description: 'ID of the phase this assignment belongs to',
	},
	{
		displayName: 'Workstream ID (Optional)',
		name: 'workstreamId',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['createAssignment'],
			},
		},
		default: '',
		description: 'ID of the workstream this assignment belongs to',
	},
	{
		displayName: 'Dry Run',
		name: 'dryRun',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['createAssignment'],
			},
		},
		description: 'Whether no actual changes will be made to your Runn account. When enabled, it will only simulate the operation.',
	},

	// ----------------------------------------
	//     assignments: deleteAssignment
	// ----------------------------------------
	{
		displayName: 'Assignment ID',
		name: 'assignmentId',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['deleteAssignment'],
			},
		},
		default: '',
		description: 'ID of the assignment to delete',
	},
	{
		displayName: 'Dry Run',
		name: 'dryRun',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['assignments'],
				operation: ['deleteAssignment'],
			},
		},
		description: 'Whether no actual changes will be made to your Runn account. When enabled, it will only simulate the operation.',
	},

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
