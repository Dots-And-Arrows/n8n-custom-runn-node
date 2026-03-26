/* eslint-disable n8n-nodes-base/node-filename-against-convention */

/**
 * Main action node for the Runn integration.
 *
 * Supports five resources: Actuals, Assignments, Clients, People, and Projects.
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
} from "n8n-workflow";

import { getRunnApi } from "./helpers/runnApi";
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
} from "./descriptions";

// Helper: format a date string to YYYY-MM-DD
function formatDate(dateString: string): string {
  if (!dateString) return "";
  // Slice the date portion directly to avoid UTC timezone shift.
  // n8n datetime fields are always ISO strings starting with YYYY-MM-DD.
  return dateString.substring(0, 10);
}

// Helper: resolve an ID-or-email string to a numeric person ID.
// If the input is numeric it is returned as-is; otherwise the Runn API
// is queried to look up the person by email.
async function getPersonId(
  this: IExecuteFunctions,
  idOrEmail: string,
  runnApi: Awaited<ReturnType<typeof getRunnApi>>,
): Promise<string> {
  if (!isNaN(Number(idOrEmail))) {
    return idOrEmail;
  }

  const personData = await runnApi.people.fetchOneByEmail(idOrEmail);
  if (!personData) {
    throw new NodeOperationError(
      this.getNode(),
      `Person with email ${idOrEmail} not found`,
      { description: "Person not found" },
    );
  }

  return personData.id;
}

// Helper: resolve an ID-or-name string to a numeric team ID.
// If the input is numeric it is returned as-is; otherwise all teams are fetched
// and the first team whose name matches (case-insensitive) is returned.
async function getTeamId(
  this: IExecuteFunctions,
  idOrName: string,
  runnApi: Awaited<ReturnType<typeof getRunnApi>>,
): Promise<number> {
  if (!isNaN(Number(idOrName))) {
    return Number(idOrName);
  }

  const teams = await runnApi.teams.fetchAll();
  const team = teams.find(
    (team: { id: number; name: string }) =>
      team.name.toLowerCase() === idOrName.toLowerCase(),
  );
  if (!team) {
    throw new NodeOperationError(
      this.getNode(),
      `Team with name "${idOrName}" not found`,
      { description: "Team not found" },
    );
  }

  return team.id;
}

export class Runn implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Runn",
    name: "runn",
    icon: "file:runn-io-logo.svg",
    group: ["transform"],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: "Interact with Runn.io API",
    usableAsTool: true,
    defaults: {
      name: "Runn",
    },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [
      {
        name: "runnApi",
        required: true,
      },
    ],
    properties: [
      {
        displayName: "Resource",
        name: "resource",
        type: "options",
        noDataExpression: true,
        options: [
          {
            // eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
            name: "Actuals",
            value: "actuals",
          },
          {
            // eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
            name: "Assignments",
            value: "assignments",
          },
          {
            // eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
            name: "Clients",
            value: "clients",
          },
          {
            // eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
            name: "Contracts",
            value: "contracts",
          },
          {
            // eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
            name: "People",
            value: "people",
          },
          {
            // eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
            name: "Projects",
            value: "projects",
          },
        ],
        default: "people",
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
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // items = all input rows passed into this node (one per workflow item)
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const resource = this.getNodeParameter("resource", 0) as string;
    const operation = this.getNodeParameter("operation", 0) as string;

    const runnApi = await getRunnApi.call(this);

    // Process each input item independently.
    // The outer try/catch handles continueOnFail — if enabled, errors are captured
    // per item and execution continues instead of stopping the whole workflow.
    for (let i = 0; i < items.length; i++) {
      try {
        let responseData: IDataObject | IDataObject[] = {};

        // ============================================================
        //                         ACTUALS
        // ============================================================
        if (resource === "actuals") {
          if (operation === "createOrUpdateActual") {
            // Uses POST /actuals/ — creates a new actual or overwrites an existing one
            // for the same combination of date + person + project + role + workstream.
            const date = formatDate(this.getNodeParameter("date", i) as string);
            const personId = this.getNodeParameter("personId", i) as number;
            const projectId = this.getNodeParameter("projectId", i) as number;
            const roleId = this.getNodeParameter("roleId", i) as number;
            const billableMinutes = this.getNodeParameter(
              "billableMinutes",
              i,
            ) as number;
            const nonbillableMinutes = this.getNodeParameter(
              "nonbillableMinutes",
              i,
            ) as number;
            const billableNote = this.getNodeParameter(
              "billableNote",
              i,
            ) as string;
            const nonbillableNote = this.getNodeParameter(
              "nonbillableNote",
              i,
            ) as string;
            const phaseId = this.getNodeParameter("phaseId", i) as number;
            const workstreamId = this.getNodeParameter(
              "workstreamId",
              i,
            ) as number;
            const dryRun = this.getNodeParameter("dryRun", i) as boolean;

            // When dryRun is true, skip the API call entirely and return a placeholder.
            // This lets users validate workflow logic without making real changes.
            if (dryRun) {
              responseData = { success: true, dry_run: true };
            } else {
              const body = {
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
              try {
                responseData = await runnApi.executeRunnApiPOST(
                  "/actuals/",
                  body,
                );
              } catch (error) {
                if (error.response) {
                  throw new NodeOperationError(
                    this.getNode(),
                    error.response.data?.message ?? error.message,
                    {
                      description: error.response.status,
                    },
                  );
                }
                throw error;
              }
            }
          } else if (operation === "deleteActual") {
            // DELETE /actuals/{id}/ returns 204 No Content, so we set an explicit response.
            const actualId = this.getNodeParameter("actualId", i) as number;
            const dryRun = this.getNodeParameter("dryRun", i) as boolean;

            if (dryRun) {
              responseData = { success: true, dry_run: true };
            } else {
              try {
                await runnApi.executeRunnApiDELETE(`/actuals/${actualId}/`);
                responseData = { success: true, actualId };
              } catch (error) {
                if (error.response) {
                  throw new NodeOperationError(
                    this.getNode(),
                    error.response.data?.message ?? error.message,
                    {
                      description: error.response.status,
                    },
                  );
                }
                throw error;
              }
            }
          } else if (operation === "fetchAllActuals") {
            const modifiedAfter = this.getNodeParameter(
              "modifiedAfter",
              i,
            ) as string;
            responseData = await runnApi.actuals.fetchAll({
              ...(modifiedAfter
                ? { modifiedAfter: new Date(modifiedAfter).toISOString() }
                : {}),
            });
          }

          // ============================================================
          //                       ASSIGNMENTS
          // ============================================================
        } else if (resource === "assignments") {
          if (operation === "createAssignment") {
            const personId = this.getNodeParameter("personId", i) as number;
            const projectId = this.getNodeParameter("projectId", i) as number;
            const roleId = this.getNodeParameter("roleId", i) as number;
            const startDate = formatDate(
              this.getNodeParameter("startDate", i) as string,
            );
            const endDate = formatDate(
              this.getNodeParameter("endDate", i) as string,
            );
            const minutesPerDay = this.getNodeParameter(
              "minutesPerDay",
              i,
            ) as number;
            const isBillable = this.getNodeParameter(
              "isBillable",
              i,
            ) as boolean;
            const isNonWorkingDay = this.getNodeParameter(
              "isNonWorkingDay",
              i,
            ) as boolean;
            const note = this.getNodeParameter("note", i) as string;
            const phaseId = this.getNodeParameter("phaseId", i) as number;
            const workstreamId = this.getNodeParameter(
              "workstreamId",
              i,
            ) as number;
            const dryRun = this.getNodeParameter("dryRun", i) as boolean;

            if (dryRun) {
              responseData = { success: true, dry_run: true };
            } else {
              const body: Record<string, unknown> = {
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
              try {
                responseData = await runnApi.executeRunnApiPOST(
                  "/assignments/",
                  body,
                );
              } catch (error) {
                if (error.response) {
                  throw new NodeOperationError(
                    this.getNode(),
                    error.response.data?.message ?? error.message,
                    {
                      description: error.response.status,
                    },
                  );
                }
                throw error;
              }
            }
          } else if (operation === "deleteAssignment") {
            const assignmentId = this.getNodeParameter(
              "assignmentId",
              i,
            ) as number;
            const dryRun = this.getNodeParameter("dryRun", i) as boolean;

            if (dryRun) {
              responseData = { success: true, dry_run: true };
            } else {
              try {
                responseData = await runnApi.executeRunnApiDELETE(
                  `/assignments/${assignmentId}/`,
                );
              } catch (error) {
                if (error.response) {
                  throw new NodeOperationError(
                    this.getNode(),
                    error.response.data?.message ?? error.message,
                    {
                      description: error.response.status,
                    },
                  );
                }
                throw error;
              }
            }
          } else if (operation === "fetchAllAssignments") {
            // Server-side filters (personId, projectId, etc.) are sent as URL params.
            // onlyActive is applied client-side after fetching because the API does
            // not expose that filter directly.
            const onlyActive = this.getNodeParameter(
              "onlyActive",
              i,
            ) as boolean;
            const personId = this.getNodeParameter("personId", i) as number;
            const projectId = this.getNodeParameter("projectId", i) as number;
            const roleId = this.getNodeParameter("roleId", i) as number;
            const startDate = formatDate(
              this.getNodeParameter("startDate", i) as string,
            );
            const endDate = formatDate(
              this.getNodeParameter("endDate", i) as string,
            );
            const modifiedAfter = this.getNodeParameter(
              "modifiedAfter",
              i,
            ) as string;

            const urlParams = {
              ...(personId ? { personId } : {}),
              ...(projectId ? { projectId } : {}),
              ...(roleId ? { roleId } : {}),
              ...(startDate ? { startDate } : {}),
              ...(endDate ? { endDate } : {}),
              ...(modifiedAfter
                ? { modifiedAfter: new Date(modifiedAfter).toISOString() }
                : {}),
            };

            let assignments = await runnApi.executeRunnApiGET("/assignments", {
              urlParams,
            });

            if (onlyActive) {
              assignments = assignments.filter(
                (a: {
                  isActive: boolean;
                  isPlaceholder: boolean;
                  isTemplate: boolean;
                }) => a.isActive && !a.isPlaceholder && !a.isTemplate,
              );
            }

            responseData = assignments;
          }

          // ============================================================
          //                         CLIENTS
          // ============================================================
        } else if (resource === "clients") {
          if (operation === "fetchAllClients") {
            const onlyActive = this.getNodeParameter(
              "onlyActive",
              i,
            ) as boolean;
            responseData = await runnApi.clients.fetchAll({ onlyActive });
          } else if (operation === "fetchClient") {
            const id = this.getNodeParameter("id", i) as string;
            try {
              responseData = await runnApi.clients.fetchOneById(id);
            } catch (error) {
              if (error.response) {
                throw new NodeOperationError(
                  this.getNode(),
                  error.response.data?.message ?? error.message,
                  {
                    description: error.response.status,
                  },
                );
              }
              throw error;
            }
          } else if (operation === "createClient") {
            const name = this.getNodeParameter("name", i) as string;
            const website = this.getNodeParameter("website", i) as string;
            const dryRun = this.getNodeParameter("dryRun", i) as boolean;

            if (dryRun) {
              responseData = { success: true, dry_run: true };
            } else {
              const otherValues = website ? { website } : {};
              try {
                responseData = await runnApi.clients.create(
                  name,
                  [],
                  otherValues,
                );
              } catch (error) {
                if (error.response) {
                  throw new NodeOperationError(
                    this.getNode(),
                    error.response.data?.message ?? error.message,
                    {
                      description: error.response.status,
                    },
                  );
                }
                throw error;
              }
            }
          } else if (operation === "updateClient") {
            const id = this.getNodeParameter("id", i) as string;
            const name = this.getNodeParameter("name", i) as string;
            const website = this.getNodeParameter("website", i) as string;
            const dryRun = this.getNodeParameter("dryRun", i) as boolean;

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
                if (error.response) {
                  throw new NodeOperationError(
                    this.getNode(),
                    error.response.data?.message ?? error.message,
                    {
                      description: error.response.status,
                    },
                  );
                }
                throw error;
              }
            }
          } else if (operation === "archiveClient") {
            const id = this.getNodeParameter("id", i) as string;
            const dryRun = this.getNodeParameter("dryRun", i) as boolean;

            if (dryRun) {
              responseData = { success: true, dry_run: true };
            } else {
              try {
                responseData = await runnApi.clients.archive(id);
              } catch (error) {
                if (error.response) {
                  throw new NodeOperationError(
                    this.getNode(),
                    error.response.data?.message ?? error.message,
                    {
                      description: error.response.status,
                    },
                  );
                }
                throw error;
              }
            }
          } else if (operation === "unarchiveClient") {
            const id = this.getNodeParameter("id", i) as string;
            const dryRun = this.getNodeParameter("dryRun", i) as boolean;

            if (dryRun) {
              responseData = { success: true, dry_run: true };
            } else {
              try {
                responseData = await runnApi.clients.unarchive(id);
              } catch (error) {
                if (error.response) {
                  throw new NodeOperationError(
                    this.getNode(),
                    error.response.data?.message ?? error.message,
                    {
                      description: error.response.status,
                    },
                  );
                }
                throw error;
              }
            }
          }

          // ============================================================
          //                        CONTRACTS
          // ============================================================
        } else if (resource === "contracts") {
          if (operation === "fetchAllContracts") {
            const modifiedAfter = this.getNodeParameter(
              "modifiedAfter",
              i,
            ) as string;
            const sortBy = this.getNodeParameter("sortBy", i) as string;
            const order = this.getNodeParameter("order", i) as string;

            const urlParams = {
              sortBy,
              order,
              ...(modifiedAfter
                ? { modifiedAfter: new Date(modifiedAfter).toISOString() }
                : {}),
            };

            responseData = await runnApi.executeRunnApiGET("/contracts/", {
              urlParams,
            });
          }

          // ============================================================
          //                         PROJECTS
          // ============================================================
        } else if (resource === "projects") {
          if (operation === "fetchAllProjects") {
            const onlyActive = this.getNodeParameter(
              "onlyActive",
              i,
            ) as boolean;
            responseData = await runnApi.projects.fetchAll({ onlyActive });
          } else if (operation === "fetchProject") {
            const id = this.getNodeParameter("id", i) as string;
            try {
              responseData = await runnApi.projects.fetchOneById(id);
            } catch (error) {
              if (error.response) {
                throw new NodeOperationError(
                  this.getNode(),
                  error.response.data?.message ?? error.message,
                  {
                    description: error.response.status,
                  },
                );
              }
              throw error;
            }
          } else if (operation === "createProject") {
            const name = this.getNodeParameter("name", i) as string;
            const clientId = this.getNodeParameter("clientId", i) as number;
            const emoji = this.getNodeParameter("emoji", i) as string;
            const isConfirmed = this.getNodeParameter(
              "isConfirmed",
              i,
            ) as boolean;
            const budget = this.getNodeParameter("budget", i) as number;
            const pricingModel = this.getNodeParameter(
              "pricingModel",
              i,
            ) as string;
            const dryRun = this.getNodeParameter("dryRun", i) as boolean;

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
                responseData = await runnApi.projects.create(
                  name,
                  clientId,
                  otherValues,
                );
              } catch (error) {
                if (error.response) {
                  throw new NodeOperationError(
                    this.getNode(),
                    error.response.data?.message ?? error.message,
                    {
                      description: error.response.status,
                    },
                  );
                }
                throw error;
              }
            }
          } else if (operation === "updateProject") {
            const id = this.getNodeParameter("id", i) as string;
            const name = this.getNodeParameter("name", i) as string;
            const isConfirmed = this.getNodeParameter(
              "isConfirmed",
              i,
            ) as boolean;
            const budget = this.getNodeParameter("budget", i) as number;
            const pricingModel = this.getNodeParameter(
              "pricingModel",
              i,
            ) as string;
            const dryRun = this.getNodeParameter("dryRun", i) as boolean;

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
                if (error.response) {
                  throw new NodeOperationError(
                    this.getNode(),
                    error.response.data?.message ?? error.message,
                    {
                      description: error.response.status,
                    },
                  );
                }
                throw error;
              }
            }
          } else if (operation === "addNote") {
            const id = this.getNodeParameter("id", i) as string;
            const note = this.getNodeParameter("note", i) as string;
            const dryRun = this.getNodeParameter("dryRun", i) as boolean;

            if (dryRun) {
              responseData = { success: true, dry_run: true };
            } else {
              try {
                responseData = await runnApi.projects.addNote(id, note);
              } catch (error) {
                if (error.response) {
                  throw new NodeOperationError(
                    this.getNode(),
                    error.response.data?.message ?? error.message,
                    {
                      description: error.response.status,
                    },
                  );
                }
                throw error;
              }
            }
          } else if (operation === "archiveProject") {
            const id = this.getNodeParameter("id", i) as string;
            const dryRun = this.getNodeParameter("dryRun", i) as boolean;

            if (dryRun) {
              responseData = { success: true, dry_run: true };
            } else {
              try {
                responseData = await runnApi.projects.archive(id);
              } catch (error) {
                if (error.response) {
                  throw new NodeOperationError(
                    this.getNode(),
                    error.response.data?.message ?? error.message,
                    {
                      description: error.response.status,
                    },
                  );
                }
                throw error;
              }
            }
          } else if (operation === "unarchiveProject") {
            const id = this.getNodeParameter("id", i) as string;
            const dryRun = this.getNodeParameter("dryRun", i) as boolean;

            if (dryRun) {
              responseData = { success: true, dry_run: true };
            } else {
              try {
                responseData = await runnApi.projects.unarchive(id);
              } catch (error) {
                if (error.response) {
                  throw new NodeOperationError(
                    this.getNode(),
                    error.response.data?.message ?? error.message,
                    {
                      description: error.response.status,
                    },
                  );
                }
                throw error;
              }
            }
          } else if (operation === "deleteProject") {
            const id = this.getNodeParameter("id", i) as string;
            const dryRun = this.getNodeParameter("dryRun", i) as boolean;

            if (dryRun) {
              responseData = { success: true, dry_run: true };
            } else {
              try {
                responseData = await runnApi.projects.delete(id);
              } catch (error) {
                if (error.response) {
                  throw new NodeOperationError(
                    this.getNode(),
                    error.response.data?.message ?? error.message,
                    {
                      description: error.response.status,
                    },
                  );
                }
                throw error;
              }
            }
          }

          // ============================================================
          //                         PEOPLE
          // ============================================================
        } else if (resource === "people") {
          if (operation === "fetchAllPeople") {
            const onlyActive = this.getNodeParameter(
              "onlyActive",
              i,
            ) as boolean;
            responseData = await runnApi.people.fetchAll({ onlyActive });
          } else if (operation === "fetchPerson") {
            // getPersonId resolves an email address to a numeric ID if needed.
            const idOrEmail = this.getNodeParameter("idOrEmail", i) as string;
            const personId = await getPersonId.call(this, idOrEmail, runnApi);
            responseData = await runnApi.people.fetchOneById(personId);
          } else if (operation === "createPerson") {
            const firstName = this.getNodeParameter("firstName", i) as string;
            const lastName = this.getNodeParameter("lastName", i) as string;
            const role = this.getNodeParameter("role", i) as string;
            const email = this.getNodeParameter("email", i) as string;
            const startDate = formatDate(
              this.getNodeParameter("startDate", i) as string,
            );
            const endDate = formatDate(
              this.getNodeParameter("endDate", i) as string,
            );
            const employmentType = this.getNodeParameter(
              "employmentType",
              i,
            ) as string;
            const teamIdInput = this.getNodeParameter("teamId", i) as string;
            const dryRun = this.getNodeParameter("dryRun", i) as boolean;

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
                responseData = await runnApi.people.create(
                  firstName,
                  lastName,
                  role,
                  otherValues,
                );
              } catch (error) {
                if (error.response) {
                  throw new NodeOperationError(
                    this.getNode(),
                    error.response.data?.message ?? error.message,
                    {
                      description: error.response.status,
                    },
                  );
                }
                throw error;
              }
              // Team assignment is a separate API call made after person creation.
              // getTeamId accepts a numeric ID or a team name and resolves it.
              if (teamIdInput) {
                const resolvedTeamId = await getTeamId.call(
                  this,
                  teamIdInput,
                  runnApi,
                );
                try {
                  await runnApi.people.addToTeam(
                    (responseData as IDataObject).id,
                    resolvedTeamId,
                  );
                } catch (error) {
                  if (error.response) {
                    throw new NodeOperationError(
                      this.getNode(),
                      error.response.data?.message ?? error.message,
                      {
                        description: error.response.status,
                      },
                    );
                  }
                  throw error;
                }
              }
            }
          } else if (operation === "updatePerson") {
            const idOrEmail = this.getNodeParameter("idOrEmail", i) as string;
            const personId = await getPersonId.call(this, idOrEmail, runnApi);
            const firstName = this.getNodeParameter("firstName", i) as string;
            const lastName = this.getNodeParameter("lastName", i) as string;
            const email = this.getNodeParameter("email", i) as string;
            const isArchived = this.getNodeParameter("isArchived", i) as
              | boolean
              | undefined;
            const dryRun = this.getNodeParameter("dryRun", i) as boolean;

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
                responseData = await runnApi.people.update(
                  personId,
                  updateValues,
                );
              } catch (error) {
                if (error.response) {
                  throw new NodeOperationError(
                    this.getNode(),
                    error.response.data?.message ?? error.message,
                    {
                      description: error.response.status,
                    },
                  );
                }
                throw error;
              }
            }
          } else if (operation === "archivePerson") {
            const idOrEmail = this.getNodeParameter("idOrEmail", i) as string;
            const personId = await getPersonId.call(this, idOrEmail, runnApi);
            const dryRun = this.getNodeParameter("dryRun", i) as boolean;

            if (dryRun) {
              responseData = { success: true, dry_run: true };
            } else {
              try {
                responseData = await runnApi.people.archive(personId);
              } catch (error) {
                if (error.response) {
                  throw new NodeOperationError(
                    this.getNode(),
                    error.response.data?.message ?? error.message,
                    {
                      description: error.response.status,
                    },
                  );
                }
                throw error;
              }
            }
          } else if (operation === "unarchivePerson") {
            const idOrEmail = this.getNodeParameter("idOrEmail", i) as string;
            const personId = await getPersonId.call(this, idOrEmail, runnApi);
            const dryRun = this.getNodeParameter("dryRun", i) as boolean;

            if (dryRun) {
              responseData = { success: true, dry_run: true };
            } else {
              try {
                responseData = await runnApi.people.unarchive(personId);
              } catch (error) {
                if (error.response) {
                  throw new NodeOperationError(
                    this.getNode(),
                    error.response.data?.message ?? error.message,
                    {
                      description: error.response.status,
                    },
                  );
                }
                throw error;
              }
            }
          } else if (operation === "deletePerson") {
            const idOrEmail = this.getNodeParameter("idOrEmail", i) as string;
            const personId = await getPersonId.call(this, idOrEmail, runnApi);
            const dryRun = this.getNodeParameter("dryRun", i) as boolean;

            if (dryRun) {
              responseData = { success: true, dry_run: true };
            } else {
              try {
                responseData = await runnApi.people.delete(personId);
              } catch (error) {
                if (error.response) {
                  throw new NodeOperationError(
                    this.getNode(),
                    error.response.data?.message ?? error.message,
                    {
                      description: error.response.status,
                    },
                  );
                }
                throw error;
              }
            }
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
