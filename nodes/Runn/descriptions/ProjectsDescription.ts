/**
 * Field and operation definitions for the Projects resource.
 * Exports projectsOperations (the operation dropdown) and projectsFields (all input fields).
 * Each field uses displayOptions to show only for the correct resource + operation combination.
 */
import { INodeProperties } from 'n8n-workflow';

export const projectsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		// eslint-disable-next-line n8n-nodes-base/node-param-default-missing
		default: 'fetchAllProjects',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['projects'],
			},
		},
		options: [
			{
				name: 'Add Note',
				value: 'addNote',
				description: 'Add a note to a project',
				action: 'Add a note to a project',
			},
			{
				name: 'Archive',
				value: 'archiveProject',
				description: 'Archive a project',
				action: 'Archive a project',
			},
			{
				name: 'Create',
				value: 'createProject',
				description: 'Create a new project',
				action: 'Create a project',
			},
			{
				name: 'Delete',
				value: 'deleteProject',
				description: 'Delete a project',
				action: 'Delete a project',
			},
			{
				name: 'Get All',
				value: 'fetchAllProjects',
				description: 'Get all projects',
				action: 'Get all projects',
			},
			{
				name: 'Get One',
				value: 'fetchProject',
				description: 'Get a single project',
				action: 'Get a project',
			},
			{
				name: 'Unarchive',
				value: 'unarchiveProject',
				description: 'Unarchive a project',
				action: 'Unarchive a project',
			},
			{
				name: 'Update',
				value: 'updateProject',
				description: 'Update a project',
				action: 'Update a project',
			},
		],
	},
];

export const projectsFields: INodeProperties[] = [
	// ----------------------------------------
	//       projects: fetchAllProjects
	// ----------------------------------------
	{
		displayName: 'Only Active',
		name: 'onlyActive',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['projects'],
				operation: ['fetchAllProjects'],
			},
		},
		description: 'Whether to return only active projects',
	},

	// ----------------------------------------
	//  projects: fetchProject / update / addNote / archive / unarchive / delete
	// ----------------------------------------
	{
		displayName: 'ID',
		name: 'id',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['projects'],
				operation: [
					'fetchProject',
					'updateProject',
					'addNote',
					'archiveProject',
					'unarchiveProject',
					'deleteProject',
				],
			},
		},
		default: '',
		description: 'ID of the project to operate on',
	},

	// ----------------------------------------
	//       projects: createProject
	// ----------------------------------------
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['projects'],
				operation: ['createProject'],
			},
		},
		default: '',
		description: 'Name of the project',
	},
	{
		displayName: 'Client ID',
		name: 'clientId',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['projects'],
				operation: ['createProject'],
			},
		},
		default: '',
		description: 'Client ID for the project',
	},

	// ----------------------------------------
	//       projects: updateProject
	// ----------------------------------------
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['projects'],
				operation: ['updateProject'],
			},
		},
		default: '',
		description: 'Name of the project',
	},
	{
		displayName: 'Client ID',
		name: 'clientId',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['projects'],
				operation: ['updateProject'],
			},
		},
		default: '',
		description: 'Client ID for the project',
	},

	// ----------------------------------------
	//  projects: createProject / updateProject
	// ----------------------------------------
	{
		displayName: 'Emoji',
		name: 'emoji',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['projects'],
				operation: ['createProject'],
			},
		},
		default: '',
		description: 'Emoji for the project',
	},
	{
		displayName: 'Is Confirmed?',
		name: 'isConfirmed',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['projects'],
				operation: ['createProject', 'updateProject'],
			},
		},
		default: false,
		description: 'Whether the project is confirmed or not',
	},
	{
		displayName: 'Budget',
		name: 'budget',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['projects'],
				operation: ['createProject', 'updateProject'],
			},
		},
		default: 0,
		description: 'Budget for the project',
	},
	{
		displayName: 'Pricing Model',
		name: 'pricingModel',
		type: 'options',
		options: [
			{
				name: 'Fixed Price',
				value: 'fp',
			},
			{
				name: 'Time and Materials',
				value: 'tm',
			},
			{
				name: 'Non-Billable',
				value: 'nb',
			},
		],
		displayOptions: {
			show: {
				resource: ['projects'],
				operation: ['createProject', 'updateProject'],
			},
		},
		default: 'fp',
		description: 'Pricing model for the project',
	},

	// ----------------------------------------
	//         projects: addNote
	// ----------------------------------------
	{
		displayName: 'Note',
		name: 'note',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['projects'],
				operation: ['addNote'],
			},
		},
		default: '',
		description: 'Note to add to the project',
	},

	// ----------------------------------------
	//      projects: all write operations
	// ----------------------------------------
	{
		displayName: 'Dry Run',
		name: 'dryRun',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['projects'],
				operation: [
					'createProject',
					'updateProject',
					'addNote',
					'archiveProject',
					'unarchiveProject',
					'deleteProject',
				],
			},
		},
		description:
			'Whether no actual changes will be made to your Runn account. When enabled, it will only simulate the operation.',
	},
];
