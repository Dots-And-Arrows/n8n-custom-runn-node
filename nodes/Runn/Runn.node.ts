/* eslint-disable n8n-nodes-base/node-filename-against-convention */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { getRunnApi } from './helpers/runnApi';
import {
	clientsOperations,
	clientsFields,
	projectsOperations,
	projectsFields,
	peopleOperations,
	peopleFields,
} from './descriptions';

// Helper: format a date string to YYYY-MM-DD
function formatDate(dateString: string): string {
	if (!dateString) return '';
	return new Date(dateString).toISOString().split('T')[0];
}

// Helper: resolve an ID-or-email string to a numeric person ID.
// If the input is numeric it is returned as-is; otherwise the Runn API
// is queried to look up the person by email.
async function getPersonId(
	this: IExecuteFunctions,
	idOrEmail: string,
	runnApi: any,
): Promise<string> {
	if (!isNaN(Number(idOrEmail))) {
		return idOrEmail;
	}

	const personData = await runnApi.people.fetchOneByEmail(idOrEmail);
	if (!personData) {
		throw new NodeOperationError(
			this.getNode(),
			`Person with email ${idOrEmail} not found`,
			{ description: 'Person not found' },
		);
	}

	return personData.id;
}

export class Runn implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Runn',
		name: 'runn',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
		icon: 'file:runn.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Runn.io API',
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
						name: 'Clients',
						value: 'clients',
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
				],
				default: 'people',
			},
			...clientsOperations,
			...clientsFields,
			...projectsOperations,
			...projectsFields,
			...peopleOperations,
			...peopleFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const runnApi = await getRunnApi.call(this);

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any;

				// ============================================================
				//                         CLIENTS
				// ============================================================
				if (resource === 'clients') {

					if (operation === 'fetchAllClients') {
						const onlyActive = this.getNodeParameter('onlyActive', i) as boolean;
						responseData = await runnApi.clients.fetchAll({ onlyActive });

					} else if (operation === 'fetchClient') {
						const id = this.getNodeParameter('id', i) as string;
						try {
							responseData = await runnApi.clients.fetchOneById(id);
						} catch (error) {
							if (error.response) {
							throw new NodeOperationError(this.getNode(), error.response.data.message, {
								description: error.response.status,
							});
						}
						throw error;
						}

					} else if (operation === 'createClient') {
						const name = this.getNodeParameter('name', i) as string;
						const website = this.getNodeParameter('website', i) as string;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							const otherValues = website ? { website } : {};
							try {
								responseData = await runnApi.clients.create(name, [], otherValues);
							} catch (error) {
								throw new NodeOperationError(this.getNode(), error.response.data.message, {
									description: error.response.status,
								});
							}
						}

					} else if (operation === 'updateClient') {
						const id = this.getNodeParameter('id', i) as string;
						const name = this.getNodeParameter('name', i) as string;
						const website = this.getNodeParameter('website', i) as string;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							const otherValues = {
								...(name ? { name } : {}),
								...(website ? { website } : {}),
							};
							try {
								responseData = await runnApi.clients.update(id, otherValues);
							} catch (error) {
								throw new NodeOperationError(this.getNode(), error.response.data.message, {
									description: error.response.status,
								});
							}
						}

					} else if (operation === 'archiveClient') {
						const id = this.getNodeParameter('id', i) as string;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							try {
								responseData = await runnApi.clients.archive(id);
							} catch (error) {
								throw new NodeOperationError(this.getNode(), error.response.data.message, {
									description: error.response.status,
								});
							}
						}

					} else if (operation === 'unarchiveClient') {
						const id = this.getNodeParameter('id', i) as string;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							try {
								responseData = await runnApi.clients.unarchive(id);
							} catch (error) {
								throw new NodeOperationError(this.getNode(), error.response.data.message, {
									description: error.response.status,
								});
							}
						}
					}

				// ============================================================
				//                         PROJECTS
				// ============================================================
				} else if (resource === 'projects') {

					if (operation === 'fetchAllProjects') {
						const onlyActive = this.getNodeParameter('onlyActive', i) as boolean;
						responseData = await runnApi.projects.fetchAll({ onlyActive });

					} else if (operation === 'fetchProject') {
						const id = this.getNodeParameter('id', i) as string;
						try {
							responseData = await runnApi.projects.fetchOneById(id);
						} catch (error) {
							if (error.response) {
							throw new NodeOperationError(this.getNode(), error.response.data.message, {
								description: error.response.status,
							});
						}
						throw error;
						}

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
							const otherValues = {
								...(emoji ? { emoji } : {}),
								...(isConfirmed !== undefined ? { isConfirmed } : {}),
								...(budget ? { budget } : {}),
								...(pricingModel ? { pricingModel } : {}),
							};
							try {
								responseData = await runnApi.projects.create(name, clientId, otherValues);
							} catch (error) {
								throw new NodeOperationError(this.getNode(), error.response.data.message, {
									description: error.response.status,
								});
							}
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
							const otherValues = {
								...(name ? { name } : {}),
								...(isConfirmed !== undefined ? { isConfirmed } : {}),
								...(budget ? { budget } : {}),
								...(pricingModel ? { pricingModel } : {}),
							};
							try {
								responseData = await runnApi.projects.update(id, otherValues);
							} catch (error) {
								throw new NodeOperationError(this.getNode(), error.response.data.message, {
									description: error.response.status,
								});
							}
						}

					} else if (operation === 'addNote') {
						const id = this.getNodeParameter('id', i) as string;
						const note = this.getNodeParameter('note', i) as string;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							try {
								responseData = await runnApi.projects.addNote(id, note);
							} catch (error) {
								throw new NodeOperationError(this.getNode(), error.response.data.message, {
									description: error.response.status,
								});
							}
						}

					} else if (operation === 'archiveProject') {
						const id = this.getNodeParameter('id', i) as string;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							try {
								responseData = await runnApi.projects.archive(id);
							} catch (error) {
								throw new NodeOperationError(this.getNode(), error.response.data.message, {
									description: error.response.status,
								});
							}
						}

					} else if (operation === 'unarchiveProject') {
						const id = this.getNodeParameter('id', i) as string;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							try {
								responseData = await runnApi.projects.unarchive(id);
							} catch (error) {
								throw new NodeOperationError(this.getNode(), error.response.data.message, {
									description: error.response.status,
								});
							}
						}

					} else if (operation === 'deleteProject') {
						const id = this.getNodeParameter('id', i) as string;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							try {
								responseData = await runnApi.projects.delete(id);
							} catch (error) {
								throw new NodeOperationError(this.getNode(), error.response.data.message, {
									description: error.response.status,
								});
							}
						}
					}

				// ============================================================
				//                         PEOPLE
				// ============================================================
				} else if (resource === 'people') {

					if (operation === 'fetchAllPeople') {
						const onlyActive = this.getNodeParameter('onlyActive', i) as boolean;
						responseData = await runnApi.people.fetchAll({ onlyActive });

					} else if (operation === 'fetchPerson') {
						const idOrEmail = this.getNodeParameter('idOrEmail', i) as string;
						const personId = await getPersonId.call(this, idOrEmail, runnApi);
						responseData = await runnApi.people.fetchOneById(personId);

					} else if (operation === 'createPerson') {
						const firstName = this.getNodeParameter('firstName', i) as string;
						const lastName = this.getNodeParameter('lastName', i) as string;
						const role = this.getNodeParameter('role', i) as string;
						const email = this.getNodeParameter('email', i) as string;
						const startDate = formatDate(this.getNodeParameter('startDate', i) as string);
						const endDate = formatDate(this.getNodeParameter('endDate', i) as string);
						const employmentType = this.getNodeParameter('employmentType', i) as string;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							const otherValues = {
								...(email ? { email } : {}),
								...(startDate ? { startDate } : {}),
								...(endDate ? { endDate } : {}),
								...(employmentType ? { employmentType } : {}),
							};
							try {
								responseData = await runnApi.people.create(firstName, lastName, role, otherValues);
							} catch (error) {
								if (error.response) {
									throw new NodeOperationError(this.getNode(), error.response.data.message, {
										description: error.response.status,
									});
								}
								throw error;
							}
						}

					} else if (operation === 'updatePerson') {
						const idOrEmail = this.getNodeParameter('idOrEmail', i) as string;
						const personId = await getPersonId.call(this, idOrEmail, runnApi);
						const firstName = this.getNodeParameter('firstName', i) as string;
						const lastName = this.getNodeParameter('lastName', i) as string;
						const email = this.getNodeParameter('email', i) as string;
						const isArchived = this.getNodeParameter('isArchived', i) as boolean | undefined;
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							const updateValues = {
								...(firstName ? { firstName } : {}),
								...(lastName ? { lastName } : {}),
								...(email ? { email } : {}),
								...(isArchived ? { isArchived } : {}),
							};
							try {
								responseData = await runnApi.people.update(personId, updateValues);
							} catch (error) {
								if (error.response) {
									throw new NodeOperationError(this.getNode(), error.response.data.message, {
										description: error.response.status,
									});
								}
								throw error;
							}
						}

					} else if (operation === 'archivePerson') {
						const idOrEmail = this.getNodeParameter('idOrEmail', i) as string;
						const personId = await getPersonId.call(this, idOrEmail, runnApi);
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							try {
								responseData = await runnApi.people.archive(personId);
							} catch (error) {
								throw new NodeOperationError(this.getNode(), error.response.data.message, {
									description: error.response.status,
								});
							}
						}

					} else if (operation === 'unarchivePerson') {
						const idOrEmail = this.getNodeParameter('idOrEmail', i) as string;
						const personId = await getPersonId.call(this, idOrEmail, runnApi);
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							try {
								responseData = await runnApi.people.unarchive(personId);
							} catch (error) {
								throw new NodeOperationError(this.getNode(), error.response.data.message, {
									description: error.response.status,
								});
							}
						}

					} else if (operation === 'deletePerson') {
						const idOrEmail = this.getNodeParameter('idOrEmail', i) as string;
						const personId = await getPersonId.call(this, idOrEmail, runnApi);
						const dryRun = this.getNodeParameter('dryRun', i) as boolean;

						if (dryRun) {
							responseData = { success: true, dry_run: true };
						} else {
							try {
								responseData = await runnApi.people.delete(personId);
							} catch (error) {
								throw new NodeOperationError(this.getNode(), error.response.data.message, {
									description: error.response.status,
								});
							}
						}
					}
				}

				returnData.push({ json: responseData, pairedItem: { item: i } });

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
