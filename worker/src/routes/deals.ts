import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { AppError, errorResponse } from "../lib/errors";
import { DEAL_STAGES, dealsService } from "../services/dealsService";
import type { AppContext } from "../types";

const deals = new Hono<AppContext>();

deals.use("*", authMiddleware);

const listQuerySchema = z.object({
  stage: z.enum(DEAL_STAGES).optional(),
  ownerId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  q: z.string().trim().max(200).optional(),
  mine: z.literal("true").optional(),
  unassigned: z.literal("true").optional(),
});

const dealIdParamSchema = z.object({
  dealId: z.string().uuid(),
});

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  clientId: z.string().uuid(),
  ownerId: z.string().uuid().optional(),
  valueAmount: z.number().positive().optional(),
  valueCurrency: z.string().length(3).optional(),
  expectedIntake: z.string().trim().max(100).optional(),
});

const updateStageSchema = z
  .object({
    stage: z.enum(DEAL_STAGES),
    lostReason: z.string().trim().min(1).max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.stage === "lost" && !data.lostReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "lostReason required when stage is lost",
        path: ["lostReason"],
      });
    }
  });

const updateOwnerSchema = z.object({
  ownerId: z.string().uuid(),
});

const noteSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

deals.get("/", async (c) => {
  try {
    const parsed = listQuerySchema.safeParse({
      stage: c.req.query("stage") || undefined,
      ownerId: c.req.query("ownerId") || undefined,
      clientId: c.req.query("clientId") || undefined,
      q: c.req.query("q") || undefined,
      mine: c.req.query("mine") === "true" ? "true" : undefined,
      unassigned: c.req.query("unassigned") === "true" ? "true" : undefined,
    });

    if (!parsed.success) {
      return errorResponse("error-validation", 400);
    }

    const profile = c.get("profile");

    if (profile.role === "client") {
      return errorResponse("error-forbidden", 403);
    }

    if (parsed.data.ownerId && profile.role !== "manager") {
      return errorResponse("error-forbidden", 403);
    }

    const data = await dealsService.list({
      env: c.env,
      profile,
      stage: parsed.data.stage,
      ownerId: parsed.data.ownerId,
      clientId: parsed.data.clientId,
      q: parsed.data.q,
      mine: parsed.data.mine === "true",
      unassigned: parsed.data.unassigned === "true",
    });

    return c.json(data);
  } catch (err) {
    if (err instanceof AppError) {
      return errorResponse(err.key, err.status);
    }
    console.error("[GET /api/deals]", err);
    return errorResponse("error-server", 500);
  }
});

deals.post("/", requireRole("sales", "manager"), async (c) => {
  try {
    const body = await c.req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("error-validation", 400);
    }

    const data = await dealsService.create({
      env: c.env,
      profile: c.get("profile"),
      title: parsed.data.title,
      clientId: parsed.data.clientId,
      ownerId: parsed.data.ownerId,
      valueAmount: parsed.data.valueAmount,
      valueCurrency: parsed.data.valueCurrency,
      expectedIntake: parsed.data.expectedIntake,
    });

    return c.json(data, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return errorResponse(err.key, err.status);
    }
    console.error("[POST /api/deals]", err);
    return errorResponse("error-server", 500);
  }
});

deals.get("/:dealId", async (c) => {
  try {
    const parsed = dealIdParamSchema.safeParse({
      dealId: c.req.param("dealId"),
    });

    if (!parsed.success) {
      return errorResponse("error-validation", 400);
    }

    const data = await dealsService.getById({
      env: c.env,
      profile: c.get("profile"),
      dealId: parsed.data.dealId,
    });

    return c.json(data);
  } catch (err) {
    if (err instanceof AppError) {
      return errorResponse(err.key, err.status);
    }
    console.error("[GET /api/deals/:dealId]", err);
    return errorResponse("error-server", 500);
  }
});

deals.patch(
  "/:dealId/stage",
  requireRole("sales", "manager"),
  async (c) => {
    try {
      const params = dealIdParamSchema.safeParse({
        dealId: c.req.param("dealId"),
      });

      if (!params.success) {
        return errorResponse("error-validation", 400);
      }

      const body = await c.req.json();
      const parsed = updateStageSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse("error-validation", 400);
      }

      const data = await dealsService.updateStage({
        env: c.env,
        profile: c.get("profile"),
        dealId: params.data.dealId,
        stage: parsed.data.stage,
        lostReason: parsed.data.lostReason,
      });

      return c.json(data);
    } catch (err) {
      if (err instanceof AppError) {
        return errorResponse(err.key, err.status);
      }
      console.error("[PATCH /api/deals/:dealId/stage]", err);
      return errorResponse("error-server", 500);
    }
  },
);

deals.patch(
  "/:dealId/owner",
  requireRole("sales", "manager"),
  async (c) => {
    try {
      const params = dealIdParamSchema.safeParse({
        dealId: c.req.param("dealId"),
      });

      if (!params.success) {
        return errorResponse("error-validation", 400);
      }

      const body = await c.req.json();
      const parsed = updateOwnerSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse("error-validation", 400);
      }

      const data = await dealsService.updateOwner({
        env: c.env,
        profile: c.get("profile"),
        dealId: params.data.dealId,
        ownerId: parsed.data.ownerId,
      });

      return c.json(data);
    } catch (err) {
      if (err instanceof AppError) {
        return errorResponse(err.key, err.status);
      }
      console.error("[PATCH /api/deals/:dealId/owner]", err);
      return errorResponse("error-server", 500);
    }
  },
);

deals.post("/:dealId/notes", requireRole("sales", "manager"), async (c) => {
  try {
    const params = dealIdParamSchema.safeParse({
      dealId: c.req.param("dealId"),
    });

    if (!params.success) {
      return errorResponse("error-validation", 400);
    }

    const body = await c.req.json();
    const parsed = noteSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("error-validation", 400);
    }

    const data = await dealsService.addNote({
      env: c.env,
      profile: c.get("profile"),
      dealId: params.data.dealId,
      body: parsed.data.body,
    });

    return c.json(data, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return errorResponse(err.key, err.status);
    }
    console.error("[POST /api/deals/:dealId/notes]", err);
    return errorResponse("error-server", 500);
  }
});

export { deals };
