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
 * Resolves visitor traffic source with fallback layers:
 * 1. Query parameter (?ref=, ?utm_source=, ?source=, ?src=, ?from=)
 * 2. HTTP Referer header domain matching
 * 3. User-Agent in-app browser heuristics (Instagram, LinkedIn, FB, TikTok, etc.)
 */
function resolveSource(path: string, referer?: string | null, ua?: string | null): string | null {
  try {
    const url = new URL(path, "https://tionusa.id");
    const ref =
      url.searchParams.get("ref") ||
      url.searchParams.get("utm_source") ||
      url.searchParams.get("source") ||
      url.searchParams.get("src") ||
      url.searchParams.get("from");
    if (ref) return `🔗 Ref: ${ref}`;
  } catch {}

  if (referer) {
    const r = referer.toLowerCase();
    if (r.includes("instagram.com")) return "📱 Instagram";
    if (r.includes("linkedin.com") || r.includes("lnkd.in")) return "💼 LinkedIn";
    if (r.includes("t.co") || r.includes("twitter.com") || r.includes("x.com")) return "🐦 X / Twitter";
    if (r.includes("github.com")) return "🐙 GitHub";
    if (r.includes("facebook.com") || r.includes("fb.me")) return "👤 Facebook";
    if (r.includes("tiktok.com")) return "🎵 TikTok";
    if (r.includes("google.")) return "🔍 Google Search";
    if (r.includes("bing.com")) return "🔍 Bing Search";
    if (r.includes("duckduckgo.com")) return "🔍 DuckDuckGo";
    if (r.includes("youtube.com") || r.includes("youtu.be")) return "▶️ YouTube";
    if (r.includes("whatsapp")) return "💬 WhatsApp";
    if (r.includes("telegram") || r.includes("t.me")) return "✈️ Telegram";
  }

  if (ua) {
    if (/Instagram/i.test(ua)) return "📱 Instagram App";
    if (/LinkedInApp/i.test(ua)) return "💼 LinkedIn App";
    if (/FBAN|FBAV/i.test(ua)) return "👤 Facebook App";
    if (/Twitter|TwitterAndroid|TwitterforiPhone/i.test(ua)) return "🐦 X / Twitter App";
    if (/musical_ly|ByteLocale|TikTok/i.test(ua)) return "🎵 TikTok App";
    if (/WhatsApp/i.test(ua)) return "💬 WhatsApp App";
    if (/Telegram/i.test(ua)) return "✈️ Telegram App";
  }

  return null;
}

/**
 * Telegram ping for a real page view (bots/owner already filtered by the
 * middleware, deduped per IP per hour by /api/visit). Fire-and-forget like
 * the contact notification: the visit row is already persisted.
 */
export function notifyVisitor(payload: Payload, v: Visit): void {
  const site = v.host === "blog" ? "blog.tionusa.id" : "tionusa.id";
  const source = resolveSource(v.path, v.referer, v.userAgent);
  const text =
    `👀 Pengunjung — ${site}${v.country ? ` (${v.country})` : ""}\n` +
    `Halaman: ${v.path}\n` +
    (source ? `Sumber: ${source}\n` : "") +
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
