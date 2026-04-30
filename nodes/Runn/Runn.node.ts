/**
 * Main action node for the Runn integration.
 *
 * Supports seven resources: Actuals, Assignments, Clients, Contracts, People, Projects, Time Offs.
 * All execute() logic lives inline in this file — one if/else branch per resource,
 * then one per operation within that resource.
 *
 * Description arrays (field definitions) are imported from descriptions/ and spread
 * into the properties array. Execute logic reads those same field values at runtime
 * using this.getNodeParameter().
 */

import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { runnApiRequest } from './helpers/runnApi';
import {
	actualsOperations,
	actualsFields,
	assignmentsOperations,
	assignmentsFields,
	clientsOperations,
	clientsFields,
	contractsOperations,
	contractsFields,
	projectsOperations,
	projectsFields,
	peopleOperations,
	peopleFields,
	timeOffsOperations,
	timeOffsFields,
} from './descriptions';

// Helper: format a date string to YYYY-MM-DD
function formatDate(dateString: string): string {
	if (!dateString) return '';
	// Slice the date portion directly to avoid UTC timezone shift.
	// n8n datetime fields are always ISO strings starting with YYYY-MM-DD.
	return dateString.substring(0, 10);
}

// Helper: resolve an ID-or-email string to a numeric person ID.
// If the input is numeric it is returned as-is; otherwise the Runn API
// is queried to look up the person by email.
async function getPersonId(this: IExecuteFunctions, idOrEmail: string): Promise<string> {
	if (!isNaN(Number(idOrEmail))) {
		return idOrEmail;
	}

	const results = await runnApiRequest.call(this, 'GET', '/people', undefined, {
		email: idOrEmail,
		includePlaceholders: true,
	});
	const people = Array.isArray(results) ? results : [results];
	const person = people[0];
	if (!person) {
		throw new NodeOperationError(this.getNode(), `Person with email ${idOrEmail} not found`, {
			description: 'Person not found',
		});
	}

	return person.id as string;
}

// Helper: resolve an ID-or-name string to a numeric team ID.
// If the input is numeric it is returned as-is; otherwise all teams are fetched
// and the first team whose name matches (case-insensitive) is returned.
async function getTeamId(this: IExecuteFunctions, idOrName: string): Promise<number> {
	if (!isNaN(Number(idOrName))) {
		return Number(idOrName);
	}

	const results = await runnApiRequest.call(this, 'GET', '/teams');
	const teams = Array.isArray(results) ? results : [results];
	const team = teams.find(
		(t: IDataObject) => (t.name as string).toLowerCase() === idOrName.toLowerCase(),
	);
	if (!team) {
		throw new NodeOperationError(this.getNode(), `Team with name "${idOrName}" not found`, {
			description: 'Team not found',
		});
	}

	return team.id as number;
}

// Helper: resolve an ID-or-name string to a numeric role ID.
// If the input is numeric it is returned as-is; otherwise all roles are fetched
// and the first role whose name matches (case-insensitive) is returned.
async function getRoleId(this: IExecuteFunctions, idOrName: string): Promise<number> {
	if (!isNaN(Number(idOrName))) {
		return Number(idOrName);
	}

	const results = await runnApiRequest.call(this, 'GET', '/roles');
	const roles = Array.isArray(results) ? results : [results];
	const role = roles.find(
		(r: IDataObject) => (r.name as string).toLowerCase() === idOrName.toLowerCase(),
	);
	if (!role) {
		throw new NodeOperationError(this.getNode(), `Role with name "${idOrName}" not found`, {
			description: 'Role not found',
		});
	}

	return role.id as number;
}

export class Runn implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Runn',
		name: 'runn',
		icon: 'file:runn-io-logo.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Runn.io API',
		usableAsTool: true,
		defaults: {
			name: 'Runn',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'runnApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						// eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
						name: 'Actuals',
						value: 'actuals',
					},
					{
						// eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
						name: 'Assignments',
						value: 'assignments',
					},
					{
						// eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
						name: 'Clients',
						value: 'clients',
					},
					{
						// eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
						name: 'Contracts',
						value: 'contracts',
					},
					{
						// eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
						name: 'People',
						value: 'people',
					},
					{
						// eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
						name: 'Projects',
						value: 'projects',
					},
					{
						// eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
						name: 'Time Offs',
						value: 'timeOffs',
					},
				],
				default: 'people',
			},
			...actualsOperations,
			...actualsFields,
			...assignmentsOperations,
			...assignmentsFields,
			...clientsOperations,
			...clientsFields,
			...contractsOperations,
			...contractsFields,
			...projectsOperations,
			...projectsFields,
			...peopleOperations,
			...peopleFields,
			...timeOffsOperations,
			...timeOffsFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// items = all input rows passed into this node (one per workflow item)
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// Process each input item independently.
		// The outer try/catch handles continueOnFail — if enabled, errors are captured
		// per item and execution continues instead of stopping the whole workflow.
		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject | IDataObject[] = {};

				// ============================================================
				//                         ACTUALS
				// ============================================================
				if (resource === 'actuals') {
					if (operation === 'createOrUpdateActual') {
						// Uses POST /actuals/ — creates a new actual or overwrites an existing one
						// for the same combination of date + person + project + role + workstream.
						const date = formatDate(this.getNodeParameter('date', i) as string);
						const personId = this.getNodeParameter('personId', i) as number;
						const projectId = this.getNodeParameter('projectId', i) as number;
						const roleId = this.getNodeParameter('roleId', i) as number;
						const billableMinutes = this.getNodeParameter('billableMinutes', i) as number;
						const nonbillableMinutes = this.getNodeParameter('nonbillableMinutes', i) as number;
						const billableNote = this.getNodeParameter('billableNote', i) as string;
						const nonbillableNote = this.getNodeParameter('nonbillableNote', i) as string;
						const phaseId = this.getNodeParameter('phaseId', i) as number;
						const workstreamId = this.getNodeParameter('workstreamId', i) as number;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						// When dryRun is true, skip the API call entirely and return a placeholder.
						// This lets users validate workflow logic without making real changes.
						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							const body: IDataObject = {
								date,
								personId,
								projectId,
								roleId,
								billableMinutes,
								nonbillableMinutes,
								...(billableNote ? { billableNote } : {}),
								...(nonbillableNote ? { nonbillableNote } : {}),
								...(phaseId ? { phaseId } : {}),
								...(workstreamId ? { workstreamId } : {}),
							};
							responseData = await runnApiRequest.call(this, 'POST', '/actuals/', body);
						}
					} else if (operation === 'deleteActual') {
						// DELETE /actuals/{id}/ returns 204 No Content, so we set an explicit response.
						const actualId = this.getNodeParameter('actualId', i) as number;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							await runnApiRequest.call(this, 'DELETE', `/actuals/${actualId}/`);
							responseData = { success: true, actualId };
						}
					} else if (operation === 'fetchAllActuals') {
						const modifiedAfter = this.getNodeParameter('modifiedAfter', i) as string;
						const qs: IDataObject = {};
						if (modifiedAfter) qs.modifiedAfter = new Date(modifiedAfter).toISOString();
						responseData = await runnApiRequest.call(this, 'GET', '/actuals', undefined, qs);
					}

					// ============================================================
					//                       ASSIGNMENTS
					// ============================================================
				} else if (resource === 'assignments') {
					if (operation === 'createAssignment') {
						const personId = this.getNodeParameter('personId', i) as number;
						const projectId = this.getNodeParameter('projectId', i) as number;
						const roleId = this.getNodeParameter('roleId', i) as number;
						const startDate = formatDate(this.getNodeParameter('startDate', i) as string);
						const endDate = formatDate(this.getNodeParameter('endDate', i) as string);
						const minutesPerDay = this.getNodeParameter('minutesPerDay', i) as number;
						const isBillable = this.getNodeParameter('isBillable', i) as boolean;
						const isNonWorkingDay = this.getNodeParameter('isNonWorkingDay', i) as boolean;
						const note = this.getNodeParameter('note', i) as string;
						const phaseId = this.getNodeParameter('phaseId', i) as number;
						const workstreamId = this.getNodeParameter('workstreamId', i) as number;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							const body: IDataObject = {
								personId,
								projectId,
								roleId,
								startDate,
								endDate,
								minutesPerDay,
								isBillable,
								isNonWorkingDay,
								...(note ? { note } : {}),
								...(phaseId ? { phaseId } : {}),
								...(workstreamId ? { workstreamId } : {}),
							};
							responseData = await runnApiRequest.call(this, 'POST', '/assignments/', body);
						}
					} else if (operation === 'deleteAssignment') {
						const assignmentId = this.getNodeParameter('assignmentId', i) as number;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							responseData = await runnApiRequest.call(
								this,
								'DELETE',
								`/assignments/${assignmentId}/`,
							);
						}
					} else if (operation === 'fetchAllAssignments') {
						// Server-side filters (personId, projectId, etc.) are sent as URL params.
						// onlyActive is applied client-side after fetching because the API does
						// not expose that filter directly.
						const onlyActive = this.getNodeParameter('onlyActive', i) as boolean;
						const personId = this.getNodeParameter('personId', i) as number;
						const projectId = this.getNodeParameter('projectId', i) as number;
						const roleId = this.getNodeParameter('roleId', i) as number;
						const startDate = formatDate(this.getNodeParameter('startDate', i) as string);
						const endDate = formatDate(this.getNodeParameter('endDate', i) as string);
						const modifiedAfter = this.getNodeParameter('modifiedAfter', i) as string;

						const qs: IDataObject = {
							...(personId ? { personId } : {}),
							...(projectId ? { projectId } : {}),
							...(roleId ? { roleId } : {}),
							...(startDate ? { startDate } : {}),
							...(endDate ? { endDate } : {}),
							...(modifiedAfter
								? { modifiedAfter: new Date(modifiedAfter).toISOString() }
								: {}),
						};

						let assignments = (await runnApiRequest.call(
							this,
							'GET',
							'/assignments',
							undefined,
							qs,
						)) as IDataObject[];

						if (onlyActive) {
							assignments = assignments.filter(
								(a: IDataObject) =>
									a.isActive && !a.isPlaceholder && !a.isTemplate,
							);
						}

						responseData = assignments;
					}

					// ============================================================
					//                         CLIENTS
					// ============================================================
				} else if (resource === 'clients') {
					if (operation === 'fetchAllClients') {
						const onlyActive = this.getNodeParameter('onlyActive', i) as boolean;
						const clients = (await runnApiRequest.call(
							this,
							'GET',
							'/clients',
						)) as IDataObject[];
						responseData = onlyActive ? clients.filter((c) => !c.isArchived) : clients;
					} else if (operation === 'fetchClient') {
						const id = this.getNodeParameter('id', i) as string;
						responseData = await runnApiRequest.call(this, 'GET', `/clients/${id}`);
					} else if (operation === 'createClient') {
						const name = this.getNodeParameter('name', i) as string;
						const website = this.getNodeParameter('website', i) as string;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							const body: IDataObject = {
								name,
								...(website ? { website } : {}),
							};
							responseData = await runnApiRequest.call(this, 'POST', '/clients', body);
						}
					} else if (operation === 'updateClient') {
						const id = this.getNodeParameter('id', i) as string;
						const name = this.getNodeParameter('name', i) as string;
						const website = this.getNodeParameter('website', i) as string;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							const body: IDataObject = {
								...(name ? { name } : {}),
								...(website ? { website } : {}),
							};
							responseData = await runnApiRequest.call(this, 'PATCH', `/clients/${id}`, body);
						}
					} else if (operation === 'archiveClient') {
						const id = this.getNodeParameter('id', i) as string;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							responseData = await runnApiRequest.call(this, 'PATCH', `/clients/${id}`, {
								isArchived: true,
							});
						}
					} else if (operation === 'unarchiveClient') {
						const id = this.getNodeParameter('id', i) as string;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							responseData = await runnApiRequest.call(this, 'PATCH', `/clients/${id}`, {
								isArchived: false,
							});
						}
					}

					// ============================================================
					//                        CONTRACTS
					// ============================================================
				} else if (resource === 'contracts') {
					if (operation === 'fetchAllContracts') {
						const modifiedAfter = this.getNodeParameter('modifiedAfter', i) as string;
						const sortBy = this.getNodeParameter('sortBy', i) as string;
						const order = this.getNodeParameter('order', i) as string;

						const qs: IDataObject = {
							sortBy,
							order,
							...(modifiedAfter
								? { modifiedAfter: new Date(modifiedAfter).toISOString() }
								: {}),
						};

						responseData = await runnApiRequest.call(
							this,
							'GET',
							'/contracts/',
							undefined,
							qs,
						);
					}

					// ============================================================
					//                         PROJECTS
					// ============================================================
				} else if (resource === 'projects') {
					if (operation === 'fetchAllProjects') {
						const onlyActive = this.getNodeParameter('onlyActive', i) as boolean;
						const projects = (await runnApiRequest.call(
							this,
							'GET',
							'/projects',
						)) as IDataObject[];
						responseData = onlyActive ? projects.filter((p) => !p.isArchived) : projects;
					} else if (operation === 'fetchProject') {
						const id = this.getNodeParameter('id', i) as string;
						responseData = await runnApiRequest.call(this, 'GET', `/projects/${id}`);
					} else if (operation === 'createProject') {
						const name = this.getNodeParameter('name', i) as string;
						const clientId = this.getNodeParameter('clientId', i) as number;
						const emoji = this.getNodeParameter('emoji', i) as string;
						const isConfirmed = this.getNodeParameter('isConfirmed', i) as boolean;
						const budget = this.getNodeParameter('budget', i) as number;
						const pricingModel = this.getNodeParameter('pricingModel', i) as string;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							const body: IDataObject = {
								name,
								clientId,
								...(emoji ? { emoji } : {}),
								...(isConfirmed !== undefined ? { isConfirmed } : {}),
								...(budget ? { budget } : {}),
								...(pricingModel ? { pricingModel } : {}),
							};
							responseData = await runnApiRequest.call(this, 'POST', '/projects', body);
						}
					} else if (operation === 'updateProject') {
						const id = this.getNodeParameter('id', i) as string;
						const name = this.getNodeParameter('name', i) as string;
						const isConfirmed = this.getNodeParameter('isConfirmed', i) as boolean;
						const budget = this.getNodeParameter('budget', i) as number;
						const pricingModel = this.getNodeParameter('pricingModel', i) as string;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							const body: IDataObject = {
								...(name ? { name } : {}),
								...(isConfirmed !== undefined ? { isConfirmed } : {}),
								...(budget ? { budget } : {}),
								...(pricingModel ? { pricingModel } : {}),
							};
							responseData = await runnApiRequest.call(this, 'PATCH', `/projects/${id}`, body);
						}
					} else if (operation === 'addNote') {
						const id = this.getNodeParameter('id', i) as string;
						const note = this.getNodeParameter('note', i) as string;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							responseData = await runnApiRequest.call(
								this,
								'POST',
								`/projects/${id}/notes`,
								{ note },
							);
						}
					} else if (operation === 'archiveProject') {
						const id = this.getNodeParameter('id', i) as string;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							responseData = await runnApiRequest.call(this, 'PATCH', `/projects/${id}`, {
								isArchived: true,
							});
						}
					} else if (operation === 'unarchiveProject') {
						const id = this.getNodeParameter('id', i) as string;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							responseData = await runnApiRequest.call(this, 'PATCH', `/projects/${id}`, {
								isArchived: false,
							});
						}
					} else if (operation === 'deleteProject') {
						const id = this.getNodeParameter('id', i) as string;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							responseData = await runnApiRequest.call(this, 'DELETE', `/projects/${id}`);
						}
					}

					// ============================================================
					//                         PEOPLE
					// ============================================================
				} else if (resource === 'people') {
					if (operation === 'fetchAllPeople') {
						const onlyActive = this.getNodeParameter('onlyActive', i) as boolean;
						const people = (await runnApiRequest.call(this, 'GET', '/people', undefined, {
							includePlaceholders: true,
						})) as IDataObject[];
						responseData = onlyActive
							? people.filter((p) => p.isActive && !p.isPlaceholder)
							: people;
					} else if (operation === 'fetchPerson') {
						// getPersonId resolves an email address to a numeric ID if needed.
						const idOrEmail = this.getNodeParameter('idOrEmail', i) as string;
						const personId = await getPersonId.call(this, idOrEmail);
						responseData = await runnApiRequest.call(this, 'GET', `/people/${personId}`);
					} else if (operation === 'createPerson') {
						const firstName = this.getNodeParameter('firstName', i) as string;
						const lastName = this.getNodeParameter('lastName', i) as string;
						const roleInput = this.getNodeParameter('role', i) as string;
						const email = this.getNodeParameter('email', i) as string;
						const startDate = formatDate(this.getNodeParameter('startDate', i) as string);
						const endDate = formatDate(this.getNodeParameter('endDate', i) as string);
						const employmentType = this.getNodeParameter('employmentType', i) as string;
						const teamIdInput = this.getNodeParameter('teamId', i) as string;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							const roleId = await getRoleId.call(this, roleInput);
							const body: IDataObject = {
								firstName,
								lastName,
								roleId,
								...(email ? { email } : {}),
								...(startDate ? { startDate } : {}),
								...(endDate ? { endDate } : {}),
								...(employmentType ? { employmentType } : {}),
							};
							responseData = await runnApiRequest.call(this, 'POST', '/people', body);

							// Team assignment is a separate API call made after person creation.
							// getTeamId accepts a numeric ID or a team name and resolves it.
							if (teamIdInput) {
								const resolvedTeamId = await getTeamId.call(this, teamIdInput);
								await runnApiRequest.call(
									this,
									'POST',
									`/people/${(responseData as IDataObject).id}/teams`,
									{ teamId: resolvedTeamId },
								);
							}
						}
					} else if (operation === 'updatePerson') {
						const idOrEmail = this.getNodeParameter('idOrEmail', i) as string;
						const personId = await getPersonId.call(this, idOrEmail);
						const firstName = this.getNodeParameter('firstName', i) as string;
						const lastName = this.getNodeParameter('lastName', i) as string;
						const email = this.getNodeParameter('email', i) as string;
						const isArchived = this.getNodeParameter('isArchived', i) as boolean | undefined;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							const body: IDataObject = {
								...(firstName ? { firstName } : {}),
								...(lastName ? { lastName } : {}),
								...(email ? { email } : {}),
								...(isArchived ? { isArchived } : {}),
							};
							responseData = await runnApiRequest.call(
								this,
								'PATCH',
								`/people/${personId}`,
								body,
							);
						}
					} else if (operation === 'archivePerson') {
						const idOrEmail = this.getNodeParameter('idOrEmail', i) as string;
						const personId = await getPersonId.call(this, idOrEmail);
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							responseData = await runnApiRequest.call(
								this,
								'PATCH',
								`/people/${personId}`,
								{ isArchived: true },
							);
						}
					} else if (operation === 'unarchivePerson') {
						const idOrEmail = this.getNodeParameter('idOrEmail', i) as string;
						const personId = await getPersonId.call(this, idOrEmail);
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							responseData = await runnApiRequest.call(
								this,
								'PATCH',
								`/people/${personId}`,
								{ isArchived: false },
							);
						}
					} else if (operation === 'deletePerson') {
						const idOrEmail = this.getNodeParameter('idOrEmail', i) as string;
						const personId = await getPersonId.call(this, idOrEmail);
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							responseData = await runnApiRequest.call(
								this,
								'DELETE',
								`/people/${personId}`,
							);
						}
					}

					// ============================================================
					//                        TIME OFFS
					// ============================================================
				} else if (resource === 'timeOffs') {
					if (operation === 'createLeave') {
						const personId = this.getNodeParameter('personId', i) as number;
						const startDate = formatDate(this.getNodeParameter('startDate', i) as string);
						const endDate = formatDate(this.getNodeParameter('endDate', i) as string);
						const note = this.getNodeParameter('note', i) as string;
						const minutesPerDay = this.getNodeParameter('minutesPerDay', i) as number;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							const body: IDataObject = {
								personId,
								startDate,
								endDate,
								...(note ? { note } : {}),
								...(minutesPerDay ? { minutesPerDay } : {}),
							};
							responseData = await runnApiRequest.call(
								this,
								'POST',
								'/time-offs/leave/',
								body,
							);
						}
					} else if (operation === 'fetchAllLeave') {
						const additionalFields = this.getNodeParameter(
							'additionalFields',
							i,
						) as IDataObject;
						const personId = additionalFields.personId as number | undefined;
						const startDate = additionalFields.startDate
							? formatDate(additionalFields.startDate as string)
							: '';
						const endDate = additionalFields.endDate
							? formatDate(additionalFields.endDate as string)
							: '';
						const modifiedAfter = additionalFields.modifiedAfter as string | undefined;
						const sortBy = (additionalFields.sortBy as string) || 'id';
						const order = (additionalFields.order as string) || 'asc';

						const qs: IDataObject = {
							sortBy,
							order,
							...(personId ? { personId } : {}),
							...(startDate ? { startDate } : {}),
							...(endDate ? { endDate } : {}),
							...(modifiedAfter
								? { modifiedAfter: new Date(modifiedAfter).toISOString() }
								: {}),
						};

						responseData = await runnApiRequest.call(
							this,
							'GET',
							'/time-offs/leave/',
							undefined,
							qs,
						);
					}
				}

				// Attach the result to the output, linked back to the originating input item.
				returnData.push({
					json: responseData as IDataObject,
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
