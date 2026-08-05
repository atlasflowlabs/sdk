import { createClient as createFetchClient, createConfig } from "./generated/client";
import { Atlasflow } from "./generated/sdk.gen";
import type { ClientOptions } from "./generated/types.gen";

/** The default base URL of the Atlasflow REST API. */
export const DEFAULT_BASE_URL = "https://api.atlasflow.com/v1";

/** Options for {@link createClient}. */
export interface CreateClientOptions {
  /**
   * The Atlasflow API key (`af_live_...`). If not set, the SDK reads the
   * `ATLASFLOW_API_KEY` environment variable.
   */
  apiKey?: string;
  /**
   * The API base URL. Defaults to {@link DEFAULT_BASE_URL}.
   */
  baseUrl?: string;
  /**
   * A custom Fetch API implementation. Defaults to the global `fetch`.
   */
  fetch?: typeof globalThis.fetch;
  /**
   * Extra HTTP headers sent with every request.
   */
  headers?: Record<string, string>;
}

const readEnv = (name: string): string | undefined =>
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[name];

/**
 * Creates an Atlasflow API client.
 *
 * ```ts
 * const atlasflow = createClient({ apiKey: "af_live_..." });
 * const { data, error } = await atlasflow.listProjects();
 * ```
 */
export function createClient(options: CreateClientOptions = {}): Atlasflow {
  const apiKey = options.apiKey ?? readEnv("ATLASFLOW_API_KEY");
  const client = createFetchClient(
    createConfig<ClientOptions>({
      auth: () => apiKey,
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      fetch: options.fetch,
      headers: options.headers,
    }),
  );
  return new Atlasflow({ client });
}

export { Atlasflow } from "./generated/sdk.gen";
export type { Client, Config, RequestResult } from "./generated/client";
export type * from "./generated/types.gen";
