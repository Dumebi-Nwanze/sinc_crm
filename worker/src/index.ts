import { Hono } from "hono";
import { cors } from "hono/cors";
import { clients } from "./routes/clients";
import { conversations } from "./routes/conversations";
import { dashboard } from "./routes/dashboard";
import { deals } from "./routes/deals";
import { inquiry } from "./routes/inquiry";
import { team } from "./routes/team";
import { users } from "./routes/users";
import type { AppContext } from "./types";

const app = new Hono<AppContext>();

app.use(
  "*",
  cors({
    origin: (origin, c) => c.env.ALLOWED_ORIGIN ? 
    c.env.ALLOWED_ORIGIN?.split(",")
    .map(origin => origin.trim())
    .includes(origin) ? origin : c.env.ALLOWED_ORIGIN : "http://localhost:5173",
    credentials: true,
  }),
);

app.get("/api/health", (c) => c.json({ ok: true }));
app.route("/api/inquiry", inquiry);
app.route("/api/clients", clients);
app.route("/api/conversations", conversations);
app.route("/api/deals", deals);
app.route("/api/dashboard", dashboard);
app.route("/api/team", team);
app.route("/api", users);

export default app;
