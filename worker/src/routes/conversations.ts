import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { AppError, errorResponse } from "../lib/errors";
import { conversationsService } from "../services/conversationsService";
import type { AppContext } from "../types";

const conversations = new Hono<AppContext>();

conversations.use("*", authMiddleware);

const listQuerySchema = z.object({
  status: z.enum(["open", "pending", "closed"]).optional(),
  assignedTo: z.string().uuid().optional(),
  mine: z.literal("true").optional(),
  unassigned: z.literal("true").optional(),
});

const threadIdParamSchema = z.object({
  threadId: z.string().uuid(),
});

const createSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10000),
  clientId: z.string().uuid().optional(),
});

const assignSchema = z.object({
  assigneeId: z.string().uuid().nullable(),
});

const statusSchema = z.object({
  status: z.enum(["open", "pending", "closed"]),
});

const messageSchema = z.object({
  body: z.string().trim().min(1).max(10000),
});

conversations.get("/", async (c) => {
  try {
    const parsed = listQuerySchema.safeParse({
      status: c.req.query("status") || undefined,
      assignedTo: c.req.query("assignedTo") || undefined,
      mine: c.req.query("mine") === "true" ? "true" : undefined,
      unassigned: c.req.query("unassigned") === "true" ? "true" : undefined,
    });

    if (!parsed.success) {
      return errorResponse("error-validation", 400);
    }

    const profile = c.get("profile");

    if (parsed.data.assignedTo && profile.role !== "manager") {
      return errorResponse("error-forbidden", 403);
    }

    const data = await conversationsService.list({
      env: c.env,
      profile,
      status: parsed.data.status,
      assignedTo: parsed.data.assignedTo,
      mine: parsed.data.mine === "true",
      unassigned: parsed.data.unassigned === "true",
    });

    return c.json(data);
  } catch (err) {
    if (err instanceof AppError) {
      return errorResponse(err.key, err.status);
    }
    console.error("[GET /api/conversations]", err);
    return errorResponse("error-server", 500);
  }
});

conversations.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("error-validation", 400);
    }

    const profile = c.get("profile");

    if (profile.role !== "client" && !parsed.data.clientId) {
      return errorResponse("error-validation", 400);
    }

    const data = await conversationsService.create({
      env: c.env,
      profile,
      subject: parsed.data.subject,
      body: parsed.data.body,
      clientId: parsed.data.clientId,
    });

    return c.json(data, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return errorResponse(err.key, err.status);
    }
    console.error("[POST /api/conversations]", err);
    return errorResponse("error-server", 500);
  }
});

conversations.patch(
  "/:threadId/assign",
  requireRole("sales", "manager"),
  async (c) => {
    try {
      const params = threadIdParamSchema.safeParse({
        threadId: c.req.param("threadId"),
      });

      if (!params.success) {
        return errorResponse("error-validation", 400);
      }

      const body = await c.req.json();
      const parsed = assignSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse("error-validation", 400);
      }

      const data = await conversationsService.assign({
        env: c.env,
        profile: c.get("profile"),
        threadId: params.data.threadId,
        assigneeId: parsed.data.assigneeId,
      });

      return c.json(data);
    } catch (err) {
      if (err instanceof AppError) {
        return errorResponse(err.key, err.status);
      }
      console.error("[PATCH /api/conversations/:threadId/assign]", err);
      return errorResponse("error-server", 500);
    }
  },
);

conversations.patch(
  "/:threadId/status",
  requireRole("sales", "manager"),
  async (c) => {
    try {
      const params = threadIdParamSchema.safeParse({
        threadId: c.req.param("threadId"),
      });

      if (!params.success) {
        return errorResponse("error-validation", 400);
      }

      const body = await c.req.json();
      const parsed = statusSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse("error-validation", 400);
      }

      const data = await conversationsService.updateStatus({
        env: c.env,
        profile: c.get("profile"),
        threadId: params.data.threadId,
        status: parsed.data.status,
      });

      return c.json(data);
    } catch (err) {
      if (err instanceof AppError) {
        return errorResponse(err.key, err.status);
      }
      console.error("[PATCH /api/conversations/:threadId/status]", err);
      return errorResponse("error-server", 500);
    }
  },
);

conversations.post("/:threadId/messages", async (c) => {
  try {
    const params = threadIdParamSchema.safeParse({
      threadId: c.req.param("threadId"),
    });

    if (!params.success) {
      return errorResponse("error-validation", 400);
    }

    const body = await c.req.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("error-validation", 400);
    }

    const data = await conversationsService.appendMessage({
      env: c.env,
      profile: c.get("profile"),
      threadId: params.data.threadId,
      body: parsed.data.body,
    });

    return c.json(data, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return errorResponse(err.key, err.status);
    }
    console.error("[POST /api/conversations/:threadId/messages]", err);
    return errorResponse("error-server", 500);
  }
});

conversations.get("/:threadId", async (c) => {
  try {
    const parsed = threadIdParamSchema.safeParse({
      threadId: c.req.param("threadId"),
    });

    if (!parsed.success) {
      return errorResponse("error-validation", 400);
    }

    const data = await conversationsService.getById({
      env: c.env,
      profile: c.get("profile"),
      threadId: parsed.data.threadId,
    });

    return c.json(data);
  } catch (err) {
    if (err instanceof AppError) {
      return errorResponse(err.key, err.status);
    }
    console.error("[GET /api/conversations/:threadId]", err);
    return errorResponse("error-server", 500);
  }
});

export { conversations };
