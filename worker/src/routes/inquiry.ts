import { Hono } from "hono";
import { z } from "zod";
import { AppError, errorResponse } from "../lib/errors";
import { onboardingService } from "../services/onboardingService";
import type { AppContext } from "../types";

const inquiry = new Hono<AppContext>();

const inquirySchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  message: z.string().trim().min(1).max(5000),
});

inquiry.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = inquirySchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("error-validation", 400);
    }

    const result = await onboardingService.submitInquiry({
      ...parsed.data,
      env: c.env,
    });

    return c.json(result, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return errorResponse(err.key, err.status);
    }
    console.error("[POST /api/inquiry]", err);
    return errorResponse("error-server", 500);
  }
});

export { inquiry };
