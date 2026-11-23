import { afterEach, describe, expect, it, vi } from "vitest";
import { type ContentStore, loadContent, parseContent } from "./content-copy";

const HASH = "a".repeat(64);
const NEWER = "b".repeat(64);
const bundle = (hash: string) => JSON.stringify({ hash, tracks: [] });

function memoryStore(text: string | null = null) {
  const store = {
    text,
    read: vi.fn(async () => store.text),
    write: vi.fn(async (next: string) => {
      store.text = next;
    }),
    clear: vi.fn(async () => {
      store.text = null;
    }),
  };
  return store;
}

const request = (store: ContentStore) => ({
  url: "https://app.example/api/v1/content",
  headers: () => ({ Cookie: "session=abc" }),
  store,
});

const reply = (status: number, body: string | null = null) =>
  vi.fn(async () => new Response(body, { status }));

const offline = () =>
  vi.fn(async () => {
    throw new TypeError("Network request failed");
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("phone content copy", () => {
  it("downloads and keeps the bundle when there is no copy", async () => {
    const fetch = reply(200, bundle(HASH));
    vi.stubGlobal("fetch", fetch);
    const store = memoryStore();
    const result = await loadContent(request(store));
    expect(result).toEqual({ ok: true, content: { hash: HASH, tracks: [] } });
    expect(store.text).toBe(bundle(HASH));
    expect(fetch).toHaveBeenCalledWith("https://app.example/api/v1/content", {
      credentials: "omit",
      headers: { Cookie: "session=abc" },
    });
  });

  it("sends the kept hash and keeps the copy on 304", async () => {
    const fetch = reply(304);
    vi.stubGlobal("fetch", fetch);
    const store = memoryStore(bundle(HASH));
    const result = await loadContent(request(store));
    expect(result).toEqual({ ok: true, content: { hash: HASH, tracks: [] } });
    expect(store.write).not.toHaveBeenCalled();
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.headers).toEqual({
      Cookie: "session=abc",
      "If-None-Match": `"${HASH}"`,
    });
  });

  it("replaces the copy when the bundle changed", async () => {
    vi.stubGlobal("fetch", reply(200, bundle(NEWER)));
    const store = memoryStore(bundle(HASH));
    const result = await loadContent(request(store));
    expect(result).toMatchObject({ ok: true, content: { hash: NEWER } });
    expect(store.text).toBe(bundle(NEWER));
  });

  it("throws away a copy it can't read and downloads again", async () => {
    const fetch = reply(200, bundle(HASH));
    vi.stubGlobal("fetch", fetch);
    const store = memoryStore("{not json");
    const result = await loadContent(request(store));
    expect(store.clear).toHaveBeenCalled();
    expect(result).toMatchObject({ ok: true, content: { hash: HASH } });
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.headers).toEqual({ Cookie: "session=abc" });
  });

  it("answers from the copy when the API can't be reached", async () => {
    vi.stubGlobal("fetch", offline());
    const store = memoryStore(bundle(HASH));
    expect(await loadContent(request(store))).toMatchObject({
      ok: true,
      content: { hash: HASH },
    });
  });

  it("fails with no copy and no connection", async () => {
    vi.stubGlobal("fetch", offline());
    expect(await loadContent(request(memoryStore()))).toEqual({
      ok: false,
      reason: "failed",
    });
  });

  it("reports a signed-out session", async () => {
    vi.stubGlobal("fetch", reply(401, "{}"));
    expect(await loadContent(request(memoryStore(bundle(HASH))))).toEqual({
      ok: false,
      reason: "signed_out",
    });
  });

  it("keeps the old copy when the new body isn't a bundle", async () => {
    vi.stubGlobal("fetch", reply(200, "<html>Bad gateway</html>"));
    const store = memoryStore(bundle(HASH));
    expect(await loadContent(request(store))).toMatchObject({
      ok: true,
      content: { hash: HASH },
    });
    expect(store.text).toBe(bundle(HASH));
  });

  it("still answers when the copy can't be saved", async () => {
    vi.stubGlobal("fetch", reply(200, bundle(HASH)));
    const store = memoryStore();
    store.write.mockRejectedValueOnce(new Error("disk full"));
    expect(await loadContent(request(store))).toMatchObject({ ok: true });
  });

  it("refuses text that isn't a bundle", () => {
    expect(parseContent("null")).toBeNull();
    expect(parseContent('{"hash":"short","tracks":[]}')).toBeNull();
    expect(parseContent(`{"hash":"${HASH}"}`)).toBeNull();
  });
});
