import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { AppError, errorResponse } from "../lib/errors";
import { onboardingService } from "../services/onboardingService";
import { teamService } from "../services/teamService";
import type { AppContext } from "../types";

const team = new Hono<AppContext>();

team.use("*", authMiddleware);

team.get("/", requireRole("manager"), async (c) => {
  try {
    const data = await teamService.listSalesMembers({ env: c.env });
    return c.json(data);
  } catch (err) {
    if (err instanceof AppError) {
      return errorResponse(err.key, err.status);
    }
    console.error("[GET /api/team]", err);
    return errorResponse("error-server", 500);
  }
});

const inviteSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
});

team.post("/invite", requireRole("manager"), async (c) => {
  try {
    const body = await c.req.json();
    const parsed = inviteSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("error-validation", 400);
    }

    const result = await onboardingService.inviteTeamMember({
      ...parsed.data,
      env: c.env,
    });

    return c.json(result, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return errorResponse(err.key, err.status);
    }
    console.error("[POST /api/team/invite]", err);
    return errorResponse("error-server", 500);
  }
});

export { team };
