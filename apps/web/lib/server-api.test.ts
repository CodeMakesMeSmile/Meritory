import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ cookie: "session=abc" }),
}));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`redirect ${to}`);
  },
}));

const { getContent } = await import("./server-api.ts");

const BUNDLE = { hash: "h1", tracks: [] };

describe("getContent", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("asks with the ETag it holds and reuses the bundle on 304", async () => {
    const seen: Headers[] = [];
    const replies = [
      new Response(JSON.stringify(BUNDLE), { headers: { etag: '"h1"' } }),
      new Response(null, { status: 304 }),
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        seen.push(new Headers(init.headers));
        return replies.shift();
      }),
    );
    expect(await getContent("/")).toEqual(BUNDLE);
    expect(await getContent("/recall")).toEqual(BUNDLE);
    expect(seen[0]?.get("if-none-match")).toBeNull();
    expect(seen[1]?.get("if-none-match")).toBe('"h1"');
    expect(seen[1]?.get("cookie")).toBe("session=abc");
  });

  it("still sends a signed-out learner to sign in", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 401 })),
    );
    await expect(getContent("/recall")).rejects.toThrow(
      "redirect /sign-in?next=%2Frecall",
    );
  });
});
