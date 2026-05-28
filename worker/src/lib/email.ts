import { AppError } from "./errors";
import type { Env } from "../types";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  env: Env;
};

export async function sendEmail({
  to,
  subject,
  html,
  env,
}: SendEmailParams): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    console.error("[sendEmail] Resend error", res.status, await res.text());
    throw new AppError("error-server", 500);
  }
}
