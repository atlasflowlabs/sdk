import { defineConfig } from "@hey-api/openapi-ts";

// Generates the typed SDK from the committed OpenAPI spec snapshot.
// The snapshot mirrors https://api.atlasflow.com/v1/openapi.yaml; the
// sync-spec workflow refreshes it after every API deploy.
export default defineConfig({
  input: "openapi.yaml",
  output: "src/generated",
  plugins: [
    "@hey-api/typescript",
    "@hey-api/client-fetch",
    {
      name: "@hey-api/sdk",
      auth: true,
      operations: {
        containerName: "Atlasflow",
        strategy: "single",
      },
    },
  ],
});
