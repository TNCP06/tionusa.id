import type { Payload } from "payload";

type NewMessage = { name: string; email: string; message: string };

const TG_API = process.env.TG_API || "https://api.telegram.org";

/**
 * Deliver a new contact message to the owner over BOTH channels (email +
 * Telegram). Not a user choice — whichever channels are configured all fire.
 *
 * Fire-and-forget: the message is already persisted, so delivery must never
 * block the request or fail the create. Each channel is independent; one being
 * down does not stop the other.
 *
 * ponytail: no queue/retry. A dropped notification still lives in /admin —
 * add a retry queue only if drops become a real problem.
 */
export function notifyNewMessage(payload: Payload, msg: NewMessage): void {
  void sendTelegram(payload, msg);
  void sendEmail(payload, msg);
}

type Visit = {
  path: string;
  host?: string | null;
  country?: string | null;
  ip?: string | null;
  referer?: string | null;
  userAgent?: string | null;
};

/**
 * Telegram ping for a real page view (bots/owner already filtered by the
 * middleware, deduped per IP per hour by /api/visit). Fire-and-forget like
 * the contact notification: the visit row is already persisted.
 */
export function notifyVisitor(payload: Payload, v: Visit): void {
  const site = v.host === "blog" ? "blog.tionusa.id" : "tionusa.id";
  const text =
    `👀 Pengunjung — ${site}${v.country ? ` (${v.country})` : ""}\n` +
    `Halaman: ${v.path}\n` +
    (v.ip ? `IP: ${v.ip}\n` : "") +
    (v.referer ? `Dari: ${v.referer}\n` : "") +
    (v.userAgent ? `UA: ${v.userAgent.slice(0, 120)}` : "");
  void postTelegram(payload, text);
}

async function sendTelegram(payload: Payload, msg: NewMessage): Promise<void> {
  const text =
    `📬 New contact message\n\n` +
    `Name: ${msg.name}\n` +
    `Email: ${msg.email}\n\n` +
    msg.message;
  await postTelegram(payload, text);
}

async function postTelegram(payload: Payload, text: string): Promise<void> {
  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.CONTACT_TG_CHAT_ID;
  if (!token || !chatId) return;

  try {
    const res = await fetch(`${TG_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!res.ok) {
      payload.logger.error(`Telegram notify failed: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    payload.logger.error(`Telegram notify error: ${err}`);
  }
}

async function sendEmail(payload: Payload, msg: NewMessage): Promise<void> {
  const to = process.env.CONTACT_EMAIL_TO || process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!process.env.SMTP_HOST || !to) return;

  try {
    await payload.sendEmail({
      to,
      replyTo: msg.email,
      subject: `New contact message from ${msg.name}`,
      text: `Name: ${msg.name}\nEmail: ${msg.email}\n\n${msg.message}`,
    });
  } catch (err) {
    payload.logger.error(`Email notify error: ${err}`);
  }
}
