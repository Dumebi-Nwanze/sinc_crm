const PRIMARY = "#134341";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function emailLayout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f5;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:${PRIMARY};padding:24px 32px;text-align:center;">
              <div style="display:inline-block;width:40px;height:40px;border-radius:8px;background:rgba(255,255,255,0.15);line-height:40px;color:#ffffff;font-weight:700;font-size:14px;letter-spacing:0.08em;">SINC</div>
              <p style="margin:12px 0 0;color:#ffffff;font-size:18px;font-weight:600;">SINC CRM</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;text-align:center;">
              &copy; SINC &mdash; Study abroad consultancy
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(label: string, href: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<p style="margin:28px 0 0;text-align:center;">
  <a href="${safeHref}" style="display:inline-block;background:${PRIMARY};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;font-size:14px;">${safeLabel}</a>
</p>`;
}

export function inquiryConfirmationEmail({
  fullName,
}: {
  fullName: string;
}): string {
  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;color:${PRIMARY};">Thanks for reaching out, ${escapeHtml(fullName)}</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#374151;">
      We received your inquiry and one of our consultants will review your message shortly.
    </p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">
      You will hear from us soon with next steps for your study abroad journey.
    </p>`;

  return emailLayout("Inquiry received", body);
}

export function clientInviteEmail({
  fullName,
  repName,
  messageSnippet,
  inviteUrl,
}: {
  fullName: string;
  repName: string;
  messageSnippet: string;
  inviteUrl: string;
}): string {
  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;color:${PRIMARY};">Hi ${escapeHtml(fullName)},</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#374151;">
      ${escapeHtml(repName)} from SINC sent you a message:
    </p>
    <blockquote style="margin:0 0 16px;padding:12px 16px;border-left:4px solid ${PRIMARY};background:#f9fafb;color:#374151;font-size:14px;line-height:1.6;">
      ${escapeHtml(messageSnippet)}
    </blockquote>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">
      Create your account to continue the conversation directly with your consultant.
    </p>
    ${ctaButton("Accept invite", inviteUrl)}`;

  return emailLayout("You have a new message from SINC", body);
}

export function clientNudgeEmail({
  fullName,
  repName,
  messageSnippet,
  inviteUrl,
}: {
  fullName: string;
  repName: string;
  messageSnippet: string;
  inviteUrl: string;
}): string {
  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;color:${PRIMARY};">Reminder for ${escapeHtml(fullName)}</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#374151;">
      ${escapeHtml(repName)} is waiting to continue your conversation:
    </p>
    <blockquote style="margin:0 0 16px;padding:12px 16px;border-left:4px solid ${PRIMARY};background:#f9fafb;color:#374151;font-size:14px;line-height:1.6;">
      ${escapeHtml(messageSnippet)}
    </blockquote>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">
      Set up your account to reply and keep everything in one place.
    </p>
    ${ctaButton("Set up account", inviteUrl)}`;

  return emailLayout("Complete your SINC account setup", body);
}

export function salesRepInviteEmail({
  fullName,
  inviteUrl,
}: {
  fullName: string;
  inviteUrl: string;
}): string {
  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;color:${PRIMARY};">Welcome to SINC, ${escapeHtml(fullName)}</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#374151;">
      You have been invited to join the SINC CRM team as a sales representative.
    </p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">
      Accept your invite to set your password and access the dashboard.
    </p>
    ${ctaButton("Accept invite", inviteUrl)}`;

  return emailLayout("Join the SINC team", body);
}
