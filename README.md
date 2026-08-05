# @atlasflow/sdk

The TypeScript SDK for the Atlasflow REST API. The SDK is generated from the
OpenAPI specification of the API. The package is ESM only.

## Installation

```sh
npm install @atlasflow/sdk
```

## Usage

Create a client with your API key. Then call the API operations as methods.

```ts
import { createClient } from "@atlasflow/sdk";

const atlasflow = createClient({ apiKey: "af_live_..." });

const { data, error } = await atlasflow.listProjects();
if (error) {
  console.error(error.title, error.detail);
} else {
  console.log(data.projects);
}
```

If you do not set `apiKey`, the SDK reads the `ATLASFLOW_API_KEY` environment
variable.

### Options

| Option    | Default                          | Description                            |
| --------- | -------------------------------- | -------------------------------------- |
| `apiKey`  | `ATLASFLOW_API_KEY` env variable | The Atlasflow API key (`af_live_...`). |
| `baseUrl` | `https://api.atlasflow.com/v1`   | The API base URL.                      |
| `fetch`   | global `fetch`                   | A custom Fetch API implementation.     |
| `headers` | none                             | Extra headers sent with every request. |

### Errors

Each method returns a result object. On success, `data` holds the parsed
response. On failure, `error` holds the RFC 7807 problem document. Set
`throwOnError: true` to throw the problem instead.

```ts
const project = await atlasflow.getProject({
  path: { id: "..." },
  throwOnError: true,
});
```

## Development

The SDK is generated from `openapi.yaml`, a committed snapshot of the
public spec at <https://api.atlasflow.com/v1/openapi.yaml>. The generated
code lives in `src/generated`. Do not edit the snapshot or the generated
code by hand.

The `sync-spec` workflow fetches the deployed spec on a schedule (and on a
`spec-deployed` repository dispatch) and opens a pull request with the
regenerated code when the spec changed. To regenerate locally:

```sh
curl -fsSL https://api.atlasflow.com/v1/openapi.yaml -o openapi.yaml
npm run generate
```

CI fails when the generated code is stale relative to the committed
snapshot.

## Releasing

Pushing a `v*` tag builds, tests, and publishes the package to npm with
provenance via trusted publishing.

## License

[Apache License 2.0](LICENSE)
