/**
 * Real email delivery for contact forms, via the Resend REST API (no SDK
 * needed). When the env vars are missing, the capability is reported as
 * disabled and the model is told to render direct contact links instead of
 * forms — no fake "send" buttons.
 */

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL);
}

export async function sendContactEmail(input: {
  formTitle: string;
  values: Record<string, string>;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) return false;

  const from = process.env.CONTACT_FROM_EMAIL ?? "justaskforit <onboarding@resend.dev>";
  const lines = Object.entries(input.values)
    .map(([key, value]) => `${key}:\n${value}`)
    .join("\n\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `justaskforit.com — ${input.formTitle}`,
        text: `A visitor submitted "${input.formTitle}" on justaskforit.com:\n\n${lines}`,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
