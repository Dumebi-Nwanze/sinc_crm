import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { AppError, errorResponse } from "../lib/errors";
import { clientsService } from "../services/clientsService";
import type { AppContext } from "../types";

const clients = new Hono<AppContext>();

clients.use("*", authMiddleware);

const listQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  assigneeId: z.string().uuid().optional(),
});

const clientIdParamSchema = z.object({
  clientId: z.string().uuid(),
});

clients.get("/", async (c) => {
  try {
    const parsed = listQuerySchema.safeParse({
      q: c.req.query("q") || undefined,
      assigneeId: c.req.query("assigneeId") || undefined,
    });

    if (!parsed.success) {
      return errorResponse("error-validation", 400);
    }

    const profile = c.get("profile");

    if (profile.role === "client") {
      return errorResponse("error-forbidden", 403);
    }

    if (parsed.data.assigneeId && profile.role !== "manager") {
      return errorResponse("error-forbidden", 403);
    }

    const data = await clientsService.list({
      env: c.env,
      profile,
      q: parsed.data.q,
      assigneeId: parsed.data.assigneeId,
    });

    return c.json(data);
  } catch (err) {
    if (err instanceof AppError) {
      return errorResponse(err.key, err.status);
    }
    console.error("[GET /api/clients]", err);
    return errorResponse("error-server", 500);
  }
});

clients.get("/:clientId", async (c) => {
  try {
    const parsed = clientIdParamSchema.safeParse({
      clientId: c.req.param("clientId"),
    });

    if (!parsed.success) {
      return errorResponse("error-validation", 400);
    }

    const data = await clientsService.getById({
      env: c.env,
      profile: c.get("profile"),
      clientId: parsed.data.clientId,
    });

    return c.json(data);
  } catch (err) {
    if (err instanceof AppError) {
      return errorResponse(err.key, err.status);
    }
    console.error("[GET /api/clients/:clientId]", err);
    return errorResponse("error-server", 500);
  }
});

clients.post(
  "/:clientId/claim",
  requireRole("sales"),
  async (c) => {
    try {
      const parsed = clientIdParamSchema.safeParse({
        clientId: c.req.param("clientId"),
      });

      if (!parsed.success) {
        return errorResponse("error-validation", 400);
      }

      const data = await clientsService.claimDeals({
        env: c.env,
        profile: c.get("profile"),
        clientId: parsed.data.clientId,
      });

      return c.json(data);
    } catch (err) {
      if (err instanceof AppError) {
        return errorResponse(err.key, err.status);
      }
      console.error("[POST /api/clients/:clientId/claim]", err);
      return errorResponse("error-server", 500);
    }
  },
);

export { clients };
