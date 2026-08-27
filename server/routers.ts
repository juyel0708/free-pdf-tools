import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { listAuditLogs, listSiteSettings, listToolSettings, updateToolSetting, upsertSiteSetting } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  tools: router({
    list: publicProcedure.query(() => listToolSettings()),
  }),
  admin: router({
    toolSettings: adminProcedure.query(() => listToolSettings()),
    siteSettings: adminProcedure.query(() => listSiteSettings()),
    auditLogs: adminProcedure.query(() => listAuditLogs()),
    toggleTool: adminProcedure.input(z.object({ toolKey: z.string().min(1).max(64), enabled: z.boolean() })).mutation(async ({ input, ctx }) => {
      await updateToolSetting(input.toolKey, input.enabled ? 1 : 0, ctx.user.id);
      return { success: true } as const;
    }),
    saveSetting: adminProcedure.input(z.object({ settingKey: z.string().min(1).max(96), value: z.string().max(10000) })).mutation(async ({ input, ctx }) => {
      await upsertSiteSetting(input.settingKey, input.value, ctx.user.id);
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
