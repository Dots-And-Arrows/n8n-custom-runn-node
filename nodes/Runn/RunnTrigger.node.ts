import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
} from 'n8n-workflow';

import { runnApiRequest } from './helpers/runnApi';

// Trigger resource and event constants
const RESOURCES = {
	PEOPLE: 'people',
	PROJECTS: 'projects',
	CLIENTS: 'clients',
	ASSIGNMENTS: 'assignments',
	ACTUALS: 'actuals',
	CONTRACTS: 'contracts',
	USERS: 'users',
	TEAMS: 'teams',
} as const;

const EVENTS = {
	CREATED: 'created',
	UPDATED: 'updated',
	DELETED: 'deleted',
} as const;

type RunnTriggerResource = (typeof RESOURCES)[keyof typeof RESOURCES];
type RunnTriggerEvent = (typeof EVENTS)[keyof typeof EVENTS];

// Helper: build the Runn app link for a triggered record
function formatRunnLink(
	resource: RunnTriggerResource,
	record: { id?: string; personId?: string },
): string {
	if (resource === 'people') return `https://app.runn.io/people/${record.id}`;
	if (resource === 'projects') return `https://app.runn.io/projects/${record.id}`;
	if (resource === 'clients') return `https://app.runn.io/clients/${record.id}`;
	if (resource === 'teams') return `https://app.runn.io/teams/${record.id}`;
	if (resource === 'users') return `https://app.runn.io/users/${record.id}`;
	// actuals, assignments and contracts link to the person page
	if (resource === 'actuals' || resource === 'assignments' || resource === 'contracts') {
		return `https://app.runn.io/people/${record.personId}`;
	}
	return '';
}

export class RunnTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Runn Trigger',
		name: 'runnTrigger',
		icon: 'file:runn-io-logo.svg',
		group: ['trigger'],
		version: 1,
		description: 'Starts the workflow when Runn events occur',
		// polling: true tells n8n to call poll() on a schedule instead of trigger()
		polling: true,
		usableAsTool: true,
		defaults: {
			name: 'When Runn events occur',
		},
		inputs: [],
		outputs: ['main'],
		subtitle:
			'={{$parameter["events"].length + " events over " + $parameter["resources"].length + " resources"}}',
		credentials: [
			{
				name: 'runnApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resources',
				name: 'resources',
				type: 'multiOptions',
				required: true,
				options: [
					{ name: 'People', value: RESOURCES.PEOPLE },
					{ name: 'Projects', value: RESOURCES.PROJECTS },
					{ name: 'Clients', value: RESOURCES.CLIENTS },
					{ name: 'Assignments', value: RESOURCES.ASSIGNMENTS },
					{ name: 'Actuals', value: RESOURCES.ACTUALS },
					{ name: 'Contracts', value: RESOURCES.CONTRACTS },
					{ name: 'Users', value: RESOURCES.USERS },
					{ name: 'Teams', value: RESOURCES.TEAMS },
				],
				default: [
					RESOURCES.PEOPLE,
					RESOURCES.ASSIGNMENTS,
					RESOURCES.ACTUALS,
					RESOURCES.PROJECTS,
				],
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				options: [
					{
						name: 'Created',
						value: EVENTS.CREATED,
						description: 'Will trigger when a new resource is created',
					},
					{
						name: 'Updated',
						value: EVENTS.UPDATED,
						description: 'Will trigger when a resource is updated',
					},
					{
						name: 'Deleted',
						value: EVENTS.DELETED,
						description:
							'Will trigger when a resource is deleted. Currently supporting only projects, people, contracts, actuals and assignments. Supported only on LIVE accounts.',
					},
				],
				default: [EVENTS.CREATED, EVENTS.UPDATED],
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const resources = this.getNodeParameter('resources', 0) as RunnTriggerResource[];
		const events = this.getNodeParameter('events', 0) as RunnTriggerEvent[];

		const webhookData = this.getWorkflowStaticData('node');

		// Initialize lastCheck time if not set (first run — capture baseline, emit nothing)
		if (!webhookData.lastCheck) {
			webhookData.lastCheck = new Date().toISOString();
			return null;
		}
		const lastCheck = webhookData.lastCheck as string;
		const modifiedAfter = new Date(lastCheck).toISOString().substring(0, 19) + 'Z';

		const resultItemsMatched: IDataObject[] = [];

		// ----------------------------------------
		//    Check created / updated events
		// ----------------------------------------
		if (events.includes(EVENTS.CREATED) || events.includes(EVENTS.UPDATED)) {
			// Fetches all records modified since lastCheck and filters by event type.
			const checkForUpdates = async (
				resourceType: RunnTriggerResource,
				endpoint: string,
				extraQs?: IDataObject,
			) => {
				const qs: IDataObject = { modifiedAfter, ...extraQs };
				const items = (await runnApiRequest.call(
					this,
					'GET',
					endpoint,
					undefined,
					qs,
				)) as IDataObject[];

				const itemsMatching = items.filter((item) => {
					let condition = false;

					if (events.includes(EVENTS.CREATED)) {
						item.trigger_event_type = EVENTS.CREATED;
						condition =
							condition ||
							new Date(item.createdAt as string).getTime() > new Date(lastCheck).getTime();
					}

					if (!condition && events.includes(EVENTS.UPDATED)) {
						item.trigger_event_type = EVENTS.UPDATED;
						condition =
							condition ||
							new Date(item.updatedAt as string).getTime() > new Date(lastCheck).getTime();
					}

					item.trigger_link = formatRunnLink(
						resourceType,
						item as { id?: string; personId?: string },
					);
					return condition;
				});

				return itemsMatching.map((item) => ({
					trigger_resource_type: resourceType,
					trigger_event_type: item.trigger_event_type,
					trigger_link: item.trigger_link,
					...item,
				}));
			};

			if (resources.includes(RESOURCES.PEOPLE)) {
				resultItemsMatched.push(
					...(await checkForUpdates(RESOURCES.PEOPLE, '/people', {
						includePlaceholders: true,
					})),
				);
			}
			if (resources.includes(RESOURCES.PROJECTS)) {
				resultItemsMatched.push(...(await checkForUpdates(RESOURCES.PROJECTS, '/projects')));
			}
			if (resources.includes(RESOURCES.CLIENTS)) {
				resultItemsMatched.push(...(await checkForUpdates(RESOURCES.CLIENTS, '/clients')));
			}
			if (resources.includes(RESOURCES.ASSIGNMENTS)) {
				resultItemsMatched.push(
					...(await checkForUpdates(RESOURCES.ASSIGNMENTS, '/assignments')),
				);
			}
			if (resources.includes(RESOURCES.ACTUALS)) {
				resultItemsMatched.push(...(await checkForUpdates(RESOURCES.ACTUALS, '/actuals')));
			}
			if (resources.includes(RESOURCES.CONTRACTS)) {
				resultItemsMatched.push(
					...(await checkForUpdates(RESOURCES.CONTRACTS, '/contracts/')),
				);
			}
			if (resources.includes(RESOURCES.USERS)) {
				resultItemsMatched.push(...(await checkForUpdates(RESOURCES.USERS, '/users')));
			}
			if (resources.includes(RESOURCES.TEAMS)) {
				resultItemsMatched.push(...(await checkForUpdates(RESOURCES.TEAMS, '/teams')));
			}
		}

		// ----------------------------------------
		//         Check deleted events
		// ----------------------------------------
		if (events.includes(EVENTS.DELETED)) {
			try {
				const activityItems = (await runnApiRequest.call(
					this,
					'GET',
					'/activity-log',
					undefined,
					{ occurredAfter: modifiedAfter },
				)) as IDataObject[];

				// Map activity log entry type to trigger resource type
				const resourceTypeMap: Record<string, RunnTriggerResource> = {
					person_deleted: RESOURCES.PEOPLE,
					project_deleted: RESOURCES.PROJECTS,
					contract_deleted: RESOURCES.CONTRACTS,
					actual_deleted: RESOURCES.ACTUALS,
					assignment_deleted: RESOURCES.ASSIGNMENTS,
				};

				resultItemsMatched.push(
					...activityItems.map((item: IDataObject) => {
						const itemType = item.type as string;
						const triggerResource = resourceTypeMap[itemType] ?? itemType;
						return {
							trigger_event_type: EVENTS.DELETED,
							trigger_resource_type: triggerResource,
							trigger_link: formatRunnLink(
								triggerResource as RunnTriggerResource,
								item as { id?: string; personId?: string },
							),
							...item,
						};
					}),
				);
			} catch {
				// Errors from the activity log are swallowed to avoid blocking the trigger
			}
		}

		// ----------------------------------------
		//     Emit matched items
		// ----------------------------------------
		if (resultItemsMatched.length === 0) return null;

		webhookData.lastCheck = new Date().toISOString();
		return [this.helpers.returnJsonArray(resultItemsMatched)];
	}
}
