# Developer Guide — n8n-nodes-runn

Everything you need to extend or maintain this node. For end-user and deployment information see the [main guide](../n8n-runn-node-guide.md).

---

## Directory structure

```
n8n-nodes-runn-main/
├── credentials/
│   └── RunnApi.credentials.ts        API key credential definition + connection test
├── nodes/Runn/
│   ├── Runn.node.ts                  Main action node — all execute() logic lives here
│   ├── RunnTrigger.node.ts           Polling trigger node
│   ├── Runn.node.json                Node metadata (display name, categories)
│   ├── runn.png                      Node icon
│   ├── helpers/
│   │   └── runnApi.ts                getRunnApi() — initialises the API client from credentials
│   └── descriptions/
│       ├── index.ts                  Barrel export for all description arrays
│       ├── ActualsDescription.ts     actualsOperations + actualsFields
│       ├── AssignmentsDescription.ts assignmentsOperations + assignmentsFields
│       ├── ClientsDescription.ts     clientsOperations + clientsFields
│       ├── PeopleDescription.ts      peopleOperations + peopleFields
│       └── ProjectsDescription.ts    projectsOperations + projectsFields
├── types/
│   └── runn-api-client.d.ts          Type declarations for the runn-api-client npm package
├── eslint.config.mjs                 ESLint 9 flat config
├── package.json
└── tsconfig.json                     Includes types/**/* for runn-api-client declarations
```

---

## How the node is structured

### Description files

Each resource has one file in `descriptions/`. The file exports two arrays:

- **`<resource>Operations`** — defines the Operation dropdown shown in the n8n UI for that resource.
- **`<resource>Fields`** — defines all input fields for that resource. Every field uses `displayOptions` to control when it appears:

```typescript
displayOptions: {
  show: {
    resource: ['people'],
    operation: ['createPerson'],
  },
},
```

Both arrays are imported and spread into `properties` in `Runn.node.ts`:

```typescript
properties: [
  resourceDropdown,
  ...actualsOperations,
  ...actualsFields,
  // ... etc.
],
```

### Execute logic

All business logic lives inline in `execute()` in `Runn.node.ts`. The structure is a nested if/else:

```typescript
if (resource === 'people') {
  if (operation === 'createPerson') {
    // read params, call API, set responseData
  } else if (operation === 'updatePerson') {
    // ...
  }
} else if (resource === 'projects') {
  // ...
}
```

There are no separate handler files — keep everything in `execute()`.

### API client

```typescript
import { getRunnApi } from './helpers/runnApi';

const runnApi = await getRunnApi.call(this);
```

`getRunnApi` reads the `runnApi` credential and initialises `runn-api-client`. Always call it with `.call(this)` to pass the n8n execution context.

The library exposes named resource groups (`runnApi.people`, `runnApi.projects`, etc.). For endpoints not covered by the library, call the underlying HTTP methods directly:

```typescript
// GET with query params
await runnApi.executeRunnApiGET('/assignments', { urlParams: { personId: 123 } });

// POST with a body
await runnApi.executeRunnApiPOST('/assignments/', body);

// DELETE
await runnApi.executeRunnApiDELETE(`/assignments/${id}/`);
```

---

## Key patterns

### Dry Run

All write operations expose a `dryRun` boolean field. Check it before making the API call:

```typescript
const dryRun = this.getNodeParameter('dryRun', i) as boolean;

if (dryRun) {
  responseData = { success: true, dry_run: true };
} else {
  // actual API call
}
```

When dry run is enabled, the API is never called. The node returns a placeholder so the rest of the workflow can be tested safely.

### Error handling

Two layers of try/catch wrap every item:

```typescript
// Outer — handles continueOnFail per item
for (let i = 0; i < items.length; i++) {
  try {
    let responseData: any;

    // Inner — converts API errors into readable NodeOperationErrors
    try {
      responseData = await runnApi.someResource.someOperation(params);
    } catch (error) {
      if (error.response) {
        // API responded with an error (4xx, 5xx) — surface the Runn message
        throw new NodeOperationError(
          this.getNode(),
          error.response.data?.message ?? error.message,
          { description: error.response.status },
        );
      }
      throw error; // network error — rethrow unchanged
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
```

Use `error.response.data?.message ?? error.message` throughout — the optional chain handles API responses that don't include a `message` field.

### Date formatting

n8n `dateTime` fields return ISO strings like `2026-03-24T00:00:00.000+01:00`. Use `formatDate()` to extract the date portion:

```typescript
function formatDate(dateString: string): string {
  if (!dateString) return '';
  // Slice directly — avoids UTC timezone shift that .toISOString() would introduce
  return dateString.substring(0, 10);
}
```

Never use `new Date(dateString).toISOString().split('T')[0]` — this converts to UTC and can shift the date by one day for users in timezones ahead of UTC.

### ID-or-name resolution

Fields that accept either a numeric ID or a human-readable name use a helper:

```typescript
async function getTeamId(this: IExecuteFunctions, idOrName: string, runnApi: any): Promise<number> {
  if (!isNaN(Number(idOrName))) return Number(idOrName); // already an ID
  const teams = await runnApi.teams.fetchAll();
  const team = teams.find((t: any) => t.name.toLowerCase() === idOrName.toLowerCase());
  if (!team) throw new NodeOperationError(this.getNode(), `Team "${idOrName}" not found`);
  return team.id;
}
```

This pattern makes the node compatible with AI agent workflows where exact IDs may not be known.

### 204 No Content responses

Some DELETE endpoints return no body. Set an explicit response instead:

```typescript
await runnApi.executeRunnApiDELETE(`/actuals/${actualId}/`);
responseData = { success: true, actualId }; // 204 has no body
```

---

## Adding a new resource

Follow these steps in order:

**1. Create the description file**

Create `nodes/Runn/descriptions/<Resource>Description.ts`. Export two arrays:

```typescript
import { INodeProperties } from 'n8n-workflow';

export const myResourceOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    // eslint-disable-next-line n8n-nodes-base/node-param-default-missing
    default: 'fetchAllMyResource',
    noDataExpression: true,
    displayOptions: { show: { resource: ['myResource'] } },
    options: [
      // options must be alphabetically sorted by `name`
      { name: 'Get All', value: 'fetchAllMyResource', description: '...', action: '...' },
    ],
  },
];

export const myResourceFields: INodeProperties[] = [
  // one field definition per field, each with displayOptions scoped to resource + operation
];
```

**2. Export from the barrel**

Add to `nodes/Runn/descriptions/index.ts`:

```typescript
export * from './MyResourceDescription';
```

**3. Import and spread in Runn.node.ts**

```typescript
import { myResourceOperations, myResourceFields } from './descriptions';

// Inside properties array:
...myResourceOperations,
...myResourceFields,
```

**4. Add to the Resource dropdown**

In `Runn.node.ts`, add a new option to the resource dropdown. Keep options alphabetically sorted:

```typescript
{ name: 'My Resource', value: 'myResource' },
```

**5. Add the execute block**

Inside `execute()`, add a new `else if` branch:

```typescript
} else if (resource === 'myResource') {
  if (operation === 'fetchAllMyResource') {
    responseData = await runnApi.myResource.fetchAll();
  }
}
```

**6. Lint and build**

```bash
npm run lint     # catch alphabetical order violations
npm run build    # confirm TypeScript compiles cleanly
```

---

## Adding a new operation to an existing resource

1. Add a new entry to the `<resource>Operations` array in the description file — **alphabetical order by `name`**
2. Add field definitions to `<resource>Fields` with `displayOptions` scoped to the new operation
3. Add an `else if (operation === '...')` branch inside the correct resource block in `execute()`
4. Run `npm run lint` and `npm run build`

---

## ESLint rules to know

| Rule | What it enforces |
|------|-----------------|
| `node-param-options-type-unsorted-items` | Operation options must be alphabetically sorted by `name`. This will fail the lint if violated. |
| `node-class-description-inputs-wrong-regular-node` | Disabled — allows using `'main'` string instead of `NodeConnectionType.Main` enum. Do not remove the disable comment. |
| `node-class-description-outputs-wrong` | Same as above. |

Run `npm run lint:fix` to auto-fix what ESLint can fix. Then `npm run lint` to confirm no remaining issues.

---

## Development workflow

```bash
npm install          # install dependencies
npm run build        # compile TypeScript + bundle icons
npm run dev          # start n8n with this node loaded (watches for changes)
npm run dev:local    # same but uses a globally installed n8n instance
npm run lint         # check for lint errors
npm run lint:fix     # auto-fix lint errors
```

Run `npm run build` before any deployment. The build output goes into `dist/`.
