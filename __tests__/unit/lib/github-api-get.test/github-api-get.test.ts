import { githubApiGet } from "@/lib/github/api-get/api-get";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("githubApiGet", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("n’autorise que api.github.com", async () => {
    await expect(
      githubApiGet({
        accessToken: "t",
        url: "https://evil.example/x",
      }),
    ).rejects.toThrow(/api.github.com/);
  });

  it("force method GET", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await githubApiGet({
      accessToken: "token",
      url: "https://api.github.com/user",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.method).toBe("GET");
  });
});
