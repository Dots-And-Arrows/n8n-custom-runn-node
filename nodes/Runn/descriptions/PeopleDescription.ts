import { INodeProperties } from 'n8n-workflow';

export const peopleOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		// eslint-disable-next-line n8n-nodes-base/node-param-default-missing
		default: 'fetchAllPeople',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['people'],
			},
		},
		options: [
			{
				name: 'Archive',
				value: 'archivePerson',
				description: 'Archive a person',
				action: 'Archive a person',
			},
			{
				name: 'Create',
				value: 'createPerson',
				description: 'Create a new person',
				action: 'Create a person',
			},
			{
				name: 'Delete',
				value: 'deletePerson',
				description: 'Delete a person',
				action: 'Delete a person',
			},
			{
				name: 'Get All',
				value: 'fetchAllPeople',
				description: 'Get all people',
				action: 'Get all people',
			},
			{
				name: 'Get One',
				value: 'fetchPerson',
				description: 'Get a single person',
				action: 'Get a person',
			},
			{
				name: 'Unarchive',
				value: 'unarchivePerson',
				description: 'Unarchive a person',
				action: 'Unarchive a person',
			},
			{
				name: 'Update',
				value: 'updatePerson',
				description: 'Update a person',
				action: 'Update a person',
			},
		],
	},
];

export const peopleFields: INodeProperties[] = [
	// ----------------------------------------
	//         people: fetchAllPeople
	// ----------------------------------------
	{
		displayName: 'Only Active',
		name: 'onlyActive',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['people'],
				operation: ['fetchAllPeople'],
			},
		},
		description: 'Whether to return only active people',
	},

	// ----------------------------------------
	//  people: fetchPerson / update / archive / unarchive / delete
	// ----------------------------------------
	{
		displayName: 'ID or Email',
		name: 'idOrEmail',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['people'],
				operation: ['fetchPerson', 'updatePerson', 'archivePerson', 'unarchivePerson', 'deletePerson'],
			},
		},
		default: '',
		description: 'ID or email of the person to operate on (at least one of them should be filled)',
	},

	// ----------------------------------------
	//         people: createPerson
	// ----------------------------------------
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['people'],
				operation: ['createPerson'],
			},
		},
		default: '',
		description: 'First name of the person',
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['people'],
				operation: ['createPerson'],
			},
		},
		default: '',
		description: 'Last name of the person',
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'name@email.com',
		displayOptions: {
			show: {
				resource: ['people'],
				operation: ['createPerson'],
			},
		},
		default: '',
		description: 'Email of the person',
	},

	// ----------------------------------------
	//         people: updatePerson
	// ----------------------------------------
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['people'],
				operation: ['updatePerson'],
			},
		},
		default: '',
		description: 'First name of the person',
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['people'],
				operation: ['updatePerson'],
			},
		},
		default: '',
		description: 'Last name of the person',
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'name@email.com',
		displayOptions: {
			show: {
				resource: ['people'],
				operation: ['updatePerson'],
			},
		},
		default: '',
		description: 'Email of the person',
	},

	// ----------------------------------------
	//         people: createPerson
	// ----------------------------------------
	{
		displayName: 'Role',
		name: 'role',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['people'],
				operation: ['createPerson'],
			},
		},
		default: '',
		description: 'Role to assign to the person (supports both role ID and string)',
	},
  {
		displayName: 'Team ID or Name',
		name: 'teamId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['people'],
				operation: ['createPerson'],
			},
		},
		default: '',
		description: 'ID or name of the team to add the person to after creation. If a name is provided, it is resolved to an ID by fetching all teams.',
	},
	{
		displayName: 'Start Date',
		name: 'startDate',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['people'],
				operation: ['createPerson'],
			},
		},
		default: '',
		description: 'Start date of the person contract (first working day). Defaults to today.',
	},
	{
		displayName: 'End Date',
		name: 'endDate',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['people'],
				operation: ['createPerson'],
			},
		},
		default: '',
		description: 'Last date of the person contract',
	},
	{
		displayName: 'Employment Type',
		name: 'employmentType',
		type: 'options',
		options: [
			{
				name: 'Empty',
				value: '',
			},
			{
				name: 'Employee',
				value: 'employee',
			},
			{
				name: 'Contractor',
				value: 'contractor',
			},
		],
		displayOptions: {
			show: {
				resource: ['people'],
				operation: ['createPerson'],
			},
		},
		default: '',
		description: 'The type of employment for the contract',
	},

	// ----------------------------------------
	//         people: updatePerson
	// ----------------------------------------
	{
		displayName: 'Is Archived?',
		name: 'isArchived',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['people'],
				operation: ['updatePerson'],
			},
		},
		default: false,
		description: 'Whether the person is archived or not',
	},

	// ----------------------------------------
	//      people: all write operations
	// ----------------------------------------
	{
		displayName: 'Dry Run',
		name: 'dryRun',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['people'],
				operation: [
					'createPerson',
					'updatePerson',
					'archivePerson',
					'unarchivePerson',
					'deletePerson',
				],
			},
		},
		description:
			'Whether no actual changes will be made to your Runn account. When enabled, it will only simulate the operation.',
	},
];
