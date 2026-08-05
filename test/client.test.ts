import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient, DEFAULT_BASE_URL } from "../src/index";

interface MockFetch {
  calls: Request[];
  fetch: typeof globalThis.fetch;
}

function mockFetch(handler: (request: Request) => Response): MockFetch {
  const calls: Request[] = [];
  const fetchImpl = (async (input: RequestInfo | URL) => {
    const request = input instanceof Request ? input : new Request(input);
    calls.push(request);
    return handler(request);
  }) as typeof globalThis.fetch;
  return { calls, fetch: fetchImpl };
}

const json = (body: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: 200,
    ...init,
  });

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createClient", () => {
  it("uses the default base URL", async () => {
    const { calls, fetch } = mockFetch(() => json({ projects: [] }));
    const atlasflow = createClient({ apiKey: "af_live_test", fetch });

    await atlasflow.listProjects();

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`${DEFAULT_BASE_URL}/projects`);
    expect(DEFAULT_BASE_URL).toBe("https://api.atlasflow.com/v1");
  });

  it("sends the API key as a bearer token", async () => {
    const { calls, fetch } = mockFetch(() => json({ projects: [] }));
    const atlasflow = createClient({ apiKey: "af_live_test", fetch });

    await atlasflow.listProjects();

    expect(calls[0].headers.get("authorization")).toBe("Bearer af_live_test");
  });

  it("reads the API key from ATLASFLOW_API_KEY", async () => {
    vi.stubEnv("ATLASFLOW_API_KEY", "af_live_from_env");
    const { calls, fetch } = mockFetch(() => json({ projects: [] }));
    const atlasflow = createClient({ fetch });

    await atlasflow.listProjects();

    expect(calls[0].headers.get("authorization")).toBe("Bearer af_live_from_env");
  });

  it("prefers the explicit API key over the environment variable", async () => {
    vi.stubEnv("ATLASFLOW_API_KEY", "af_live_from_env");
    const { calls, fetch } = mockFetch(() => json({ projects: [] }));
    const atlasflow = createClient({ apiKey: "af_live_explicit", fetch });

    await atlasflow.listProjects();

    expect(calls[0].headers.get("authorization")).toBe("Bearer af_live_explicit");
  });

  it("accepts a custom base URL", async () => {
    const { calls, fetch } = mockFetch(() => json({ projects: [] }));
    const atlasflow = createClient({
      apiKey: "af_live_test",
      baseUrl: "http://127.0.0.1:8080/v1",
      fetch,
    });

    await atlasflow.listProjects();

    expect(calls[0].url).toBe("http://127.0.0.1:8080/v1/projects");
  });

  it("sends extra headers with every request", async () => {
    const { calls, fetch } = mockFetch(() => json({ projects: [] }));
    const atlasflow = createClient({
      apiKey: "af_live_test",
      fetch,
      headers: { "X-Trace-Id": "trace-123" },
    });

    await atlasflow.listProjects();

    expect(calls[0].headers.get("x-trace-id")).toBe("trace-123");
  });

  it("interpolates path parameters", async () => {
    const { calls, fetch } = mockFetch(() => json({ id: "p_123" }));
    const atlasflow = createClient({ apiKey: "af_live_test", fetch });

    await atlasflow.getProject({ path: { id: "p_123" } });

    expect(calls[0].url).toBe(`${DEFAULT_BASE_URL}/projects/p_123`);
    expect(calls[0].method).toBe("GET");
  });

  it("sends JSON request bodies", async () => {
    const { calls, fetch } = mockFetch(() => json({ id: "p_123" }, { status: 201 }));
    const atlasflow = createClient({ apiKey: "af_live_test", fetch });

    const body = { name: "demo", github_repository: "atlasflowlabs/demo" };
    await atlasflow.createProject({ body });

    expect(calls[0].method).toBe("POST");
    expect(calls[0].headers.get("content-type")).toContain("application/json");
    expect(await calls[0].json()).toEqual(body);
  });

  it("returns parsed data on success", async () => {
    const { fetch } = mockFetch(() => json({ projects: [{ slug: "demo" }] }));
    const atlasflow = createClient({ apiKey: "af_live_test", fetch });

    const { data, error, response } = await atlasflow.listProjects();

    expect(error).toBeUndefined();
    expect(data).toEqual({ projects: [{ slug: "demo" }] });
    expect(response?.status).toBe(200);
  });

  it("returns RFC 7807 problems in the error field", async () => {
    const problem = {
      title: "Not Found",
      status: 404,
      detail: "project not found",
    };
    const { fetch } = mockFetch(() =>
      json(problem, {
        headers: { "Content-Type": "application/problem+json" },
        status: 404,
      }),
    );
    const atlasflow = createClient({ apiKey: "af_live_test", fetch });

    const { data, error, response } = await atlasflow.getProject({
      path: { id: "missing" },
    });

    expect(data).toBeUndefined();
    expect(error).toEqual(problem);
    expect(response?.status).toBe(404);
  });

  it("throws when throwOnError is set", async () => {
    const { fetch } = mockFetch(() =>
      json({ title: "Unauthorized", status: 401 }, { status: 401 }),
    );
    const atlasflow = createClient({ apiKey: "af_live_bad", fetch });

    await expect(atlasflow.listProjects({ throwOnError: true })).rejects.toMatchObject({
      title: "Unauthorized",
    });
  });

  it("omits the authorization header without an API key", async () => {
    const { calls, fetch } = mockFetch(() => json({ projects: [] }));
    const atlasflow = createClient({ fetch });

    await atlasflow.listProjects();

    expect(calls[0].headers.get("authorization")).toBeNull();
  });
});
