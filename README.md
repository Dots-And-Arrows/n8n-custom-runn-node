# n8n-nodes-runn

This is an n8n community node. It lets you use the **Runn** API in your n8n workflows.

Runn is a resource planning and project forecasting platform. This node allows you to manage people, projects, and clients, and react to changes in real time using the trigger node.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation) |
[Operations](#operations) |
[Credentials](#credentials) |
[Compatibility](#compatibility) |
[Usage](#usage) |
[Resources](#resources) |
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Local Development

```bash
# Install dependencies
npm install

# Build before you run
npm run build

# Start n8n with the custom node loaded (recommended)
npm run dev

# Alternative: use globally installed n8n
npm run dev:local
```

## Operations

### Actuals

| Operation          | Description                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| **Create or Update** | Create or update an actual. Overwrites any existing actual for the same date, person, project, role, and workstream. |
| **Delete**         | Delete an actual by ID                                                                              |
| **Get All**        | Get all actuals, with an optional **Modified After** date filter                                    |

### Assignments

| Operation   | Description                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| **Create**  | Create a new assignment. Required: Person ID, Project ID, Role ID, Start Date, End Date, Minutes Per Day. Optional: Billable, Include Non-Working Days, Note, Phase ID, Workstream ID |
| **Delete**  | Delete an assignment by ID                                                                          |
| **Get All** | Get all assignments, with optional filters: Person ID, Project ID, Role ID, Start Date, End Date, Modified After, Only Active |

### People

| Operation   | Description              |
| ----------- | ------------------------ |
| **Archive** | Archive a person         |
| **Create**  | Create a new person      |
| **Delete**  | Delete a person          |
| **Get All** | Get all people           |
| **Get One** | Get a single person      |
| **Unarchive** | Unarchive a person     |
| **Update**  | Update a person          |

### Projects

| Operation    | Description                |
| ------------ | -------------------------- |
| **Add Note** | Add a note to a project    |
| **Archive**  | Archive a project          |
| **Create**   | Create a new project       |
| **Delete**   | Delete a project           |
| **Get All**  | Get all projects           |
| **Get One**  | Get a single project       |
| **Unarchive** | Unarchive a project       |
| **Update**   | Update a project           |

### Clients

| Operation     | Description           |
| ------------- | --------------------- |
| **Archive**   | Archive a client      |
| **Create**    | Create a new client   |
| **Get All**   | Get all clients       |
| **Get One**   | Get a single client   |
| **Unarchive** | Unarchive a client    |
| **Update**    | Update a client       |

### Contracts

| Operation   | Description                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| **Get All** | Get all contracts, with optional filters: Modified After, Sort By (id / createdAt / updatedAt), Order (asc / desc) |

### Time Offs

| Operation        | Description                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Create Leave** | Create a leave time off for a person. Automatically merges overlapping time offs. Required: Person ID, Start Date, End Date. Optional: Minutes Per Day, Note. |
| **Get All Leave** | Get all leave time offs, with optional filters: Person ID, Start Date, End Date, Modified After, Sort By, Order.        |

### Runn Trigger

The trigger node polls the Runn API and fires when records are created, updated, or deleted.

**Resources:** People, Projects, Clients, Assignments, Actuals, Contracts, Users, Teams

**Events:** Created, Updated, Deleted

Each trigger output includes a `runnLink` field with a direct link to the changed record in the Runn app.

## Credentials

To use this node you need a Runn API key:

| Field       | Description                                                                               |
| ----------- | ----------------------------------------------------------------------------------------- |
| **API Key** | Your Runn API key. Generate one in Runn under **Settings → API**. |

The node authenticates using a `Bearer` token in the `Authorization` header.

## Compatibility

- Requires Node.js **v18** or higher
- Uses the [`runn-api-client`](https://www.npmjs.com/package/runn-api-client) npm package

## Usage

1. Add the **Runn** node (or **Runn Trigger**) to your workflow
2. Configure your Runn API credentials
3. Select a resource (**Actuals**, **Assignments**, **Clients**, **Contracts**, **People**, **Projects**, or **Time Offs**)
4. Choose an operation
5. Fill in the required parameters
6. Execute the workflow

**Tip:** Use the **Runn Trigger** node to automatically start workflows when records change in Runn — no webhooks required, it uses polling.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Runn API documentation](https://developer.runn.io/reference/)
- [How to generate a Runn API token](https://help.runn.io/en/articles/7039247-how-to-generate-an-api-token-in-runn)
- [GitHub repository](https://github.com/Dots-And-Arrows/n8n-custom-runn-node)

## Version history

### 1.0.7

- Added **Time Offs resource** with Create Leave (POST `/time-offs/leave/`) and Get All Leave (GET `/time-offs/leave/`) operations

### 1.0.6

- Added **Contracts resource** with Get All operation (GET `/contracts/`), supporting optional filters: Modified After, Sort By, and Order

### 1.0.5

- Added **Delete** operation to Assignments resource
- Fixed date timezone bug: dates no longer shift by one day for users in timezones ahead of UTC

### 1.0.4

- Added **Create** operation to Assignments resource (POST `/assignments/`) with required fields (Person ID, Project ID, Role ID, Start Date, End Date, Minutes Per Day) and optional fields (Billable, Include Non-Working Days, Note, Phase ID, Workstream ID)

### 1.0.3

- Added **Assignments resource** with Get All operation, supporting server-side filters (Person ID, Project ID, Role ID, Start Date, End Date, Modified After) and client-side Only Active filter

### 1.0.2

- Added **Actuals resource** with Create or Update, Delete, and Get All operations

### 1.0.1

- Added **Team ID or Name** field to the People > Create operation — accepts either a numeric ID or a team name (resolved automatically)
- Fixed credential test: corrected API base URL and added required headers so the green "Connection tested" badge now appears
- Fixed `updatePerson`: First Name, Last Name, and Email are no longer required fields (partial updates now work)
- Fixed trigger node: removed duplicate fields in trigger output
- Fixed error handling: all write operations now handle network errors safely
- Removed debug-level logging from production API calls

### 1.0.0

- Initial release
- **People resource** with Archive, Create, Delete, Get All, Get One, Unarchive, and Update operations
- **Projects resource** with Add Note, Archive, Create, Delete, Get All, Get One, Unarchive, and Update operations
- **Clients resource** with Archive, Create, Get All, Get One, Unarchive, and Update operations
- **Runn Trigger** node for polling-based event detection across all resources
- Bearer token authentication with credential test
