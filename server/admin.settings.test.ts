import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const contextFor = (role: "admin" | "user"): TrpcContext => ({
  user: { id: 1, openId: "test-user", name: "Test", email: "test@example.com", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("admin settings access", () => {
  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(contextFor("user"));
    await expect(caller.admin.toolSettings()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an authenticated admin to read tool settings", async () => {
    const caller = appRouter.createCaller(contextFor("admin"));
    const result = await caller.admin.toolSettings();
    expect(Array.isArray(result)).toBe(true);
  });
});
