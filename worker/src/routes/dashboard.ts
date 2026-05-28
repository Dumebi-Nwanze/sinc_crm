import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { AppError, errorResponse } from "../lib/errors";
import { dashboardService } from "../services/dashboardService";
import type { AppContext } from "../types";

const dashboard = new Hono<AppContext>();

dashboard.use("*", authMiddleware);

dashboard.get("/", async (c) => {
  try {
    const data = await dashboardService.getStats({
      env: c.env,
      profile: c.get("profile"),
    });

    return c.json(data);
  } catch (err) {
    if (err instanceof AppError) {
      return errorResponse(err.key, err.status);
    }
    console.error("[GET /api/dashboard]", err);
    return errorResponse("error-server", 500);
  }
});

export { dashboard };
