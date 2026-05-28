import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { AppError, errorResponse } from "../lib/errors";
import { onboardingService } from "../services/onboardingService";
import type { AppContext } from "../types";

const users = new Hono<AppContext>();

users.use("*", authMiddleware);

users.get("/me", (c) => {
  const profile = c.get("profile");
  const email = c.get("userEmail");

  return c.json({
    id: profile.id,
    fullName: profile.full_name,
    role: profile.role,
    email,
  });
});

users.post("/me/claim", async (c) => {
  try {
    const userId = c.get("userId");
    const email = c.get("userEmail");

    if (!email) {
      return errorResponse("error-unauthorized", 401);
    }

    const profile = await onboardingService.claimClientAccount({
      userId,
      email,
      env: c.env,
    });

    return c.json({
      id: profile.id,
      fullName: profile.full_name,
      role: profile.role,
      email,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return errorResponse(err.key, err.status);
    }
    console.error("[POST /api/me/claim]", err);
    return errorResponse("error-server", 500);
  }
});

export { users };
