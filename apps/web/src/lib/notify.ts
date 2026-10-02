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
 * Normalizes an IP address into its routing subnet (/24 for IPv4, /64 for IPv6)
 * to prevent duplicate visitor sessions from IP rotation or cluster pools.
 */
export function getIpSubnet(ip?: string | null): string {
  if (!ip) return "";
  const clean = ip.replace(/^::ffff:/i, "").trim();
  if (clean.includes(":")) {
    const parts = clean.split(":").filter(Boolean);
    return parts.slice(0, 4).join(":") + "::/64";
  }
  const parts = clean.split(".");
  if (parts.length === 4) {
    return parts.slice(0, 3).join(".") + ".0/24";
  }
  return clean;
}

export type TrackedVisit = Visit & {
  key: string;
  isBot?: boolean;
  botName?: string;
};

type VisitorSession = {
  messageIdPromise?: Promise<number | undefined>;
  messageId?: number;
  firstVisit: number;
  lastVisit: number;
  count: number;
  baseText: string;
  lastPath: string;
  lastEditTime: number;
  timer?: NodeJS.Timeout;
};

const visitorSessions = new Map<string, VisitorSession>();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour sliding window
const MIN_EDIT_INTERVAL_MS = 3000; // Throttle: max 1 edit every 3s per visitor to respect Telegram rate limits

function formatEditedText(session: VisitorSession): string {
  return `${session.baseText}\n\n🔄 Kunjungan: ${session.count}x dalam waktu dekat (terakhir: ${session.lastPath})`;
}

async function performEdit(payload: Payload, session: VisitorSession): Promise<void> {
  session.lastEditTime = Date.now();
  const messageId = session.messageId ?? (await session.messageIdPromise);
  if (!messageId) return;

  const text = formatEditedText(session);
  await editTelegram(payload, messageId, text);
}

function scheduleEdit(payload: Payload, session: VisitorSession): void {
  if (session.timer) return;

  const now = Date.now();
  const elapsed = now - session.lastEditTime;

  if (elapsed >= MIN_EDIT_INTERVAL_MS) {
    void performEdit(payload, session);
  } else {
    session.timer = setTimeout(() => {
      session.timer = undefined;
      void performEdit(payload, session);
    }, MIN_EDIT_INTERVAL_MS - elapsed);
  }
}

/**
 * Tracks a visitor/bot pageview. On the 1st visit within WINDOW_MS, sends a new Telegram
 * message. On subsequent visits, throttles and updates the initial message with the rolling count.
 */
export function trackVisitorVisit(
  payload: Payload,
  v: TrackedVisit
): { isFirst: boolean; count: number } {
  const now = Date.now();

  // Periodic memory eviction
  if (visitorSessions.size > 5000) {
    for (const [key, s] of visitorSessions) {
      if (now - s.lastVisit > WINDOW_MS) {
        if (s.timer) clearTimeout(s.timer);
        visitorSessions.delete(key);
      }
    }
  }

  let session = visitorSessions.get(v.key);
  if (session && now - session.firstVisit < WINDOW_MS) {
    session.count++;
    session.lastVisit = now;
    session.lastPath = v.path;
    scheduleEdit(payload, session);
    return { isFirst: false, count: session.count };
  }

  if (session?.timer) {
    clearTimeout(session.timer);
  }

  const site = v.host === "blog" ? "blog.tionusa.id" : "tionusa.id";
  const source = resolveSource(v.path, v.referer, v.userAgent);
  const title = v.isBot
    ? `🤖 Bot${v.botName ? ` (${v.botName})` : ""} — ${site}${v.country ? ` (${v.country})` : ""}`
    : `👀 Pengunjung — ${site}${v.country ? ` (${v.country})` : ""}`;

  const baseText =
    `${title}\n` +
    `Halaman: ${v.path}\n` +
    (source ? `Sumber: ${source}\n` : "") +
    (v.ip ? `IP: ${v.ip}\n` : "") +
    (v.referer ? `Dari: ${v.referer}\n` : "") +
    (v.userAgent ? `UA: ${v.userAgent.slice(0, 120)}` : "");

  session = {
    firstVisit: now,
    lastVisit: now,
    count: 1,
    baseText,
    lastPath: v.path,
    lastEditTime: now,
  };

  session.messageIdPromise = postTelegram(payload, baseText).then((id) => {
    session!.messageId = id;
    return id;
  });

  visitorSessions.set(v.key, session);
  return { isFirst: true, count: 1 };
}

/**
 * Backwards-compatible helper for single visitor notification ping.
 */
export function notifyVisitor(payload: Payload, v: Visit): void {
  const subnet = getIpSubnet(v.ip);
  trackVisitorVisit(payload, {
    ...v,
    key: subnet || v.ip || v.userAgent || "unknown",
  });
}

async function sendTelegram(payload: Payload, msg: NewMessage): Promise<void> {
  const text =
    `📬 New contact message\n\n` +
    `Name: ${msg.name}\n` +
    `Email: ${msg.email}\n\n` +
    msg.message;
  await postTelegram(payload, text);
}

async function postTelegram(payload: Payload, text: string): Promise<number | undefined> {
  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.CONTACT_TG_CHAT_ID;
  if (!token || !chatId) return undefined;

  try {
    const res = await fetch(`${TG_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!res.ok) {
      payload.logger.error(`Telegram notify failed: ${res.status} ${await res.text()}`);
      return undefined;
    }
    const data = (await res.json().catch(() => null)) as {
      ok?: boolean;
      result?: { message_id?: number };
    } | null;
    return data?.result?.message_id;
  } catch (err) {
    payload.logger.error(`Telegram notify error: ${err}`);
    return undefined;
  }
}

async function editTelegram(payload: Payload, messageId: number, text: string): Promise<void> {
  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.CONTACT_TG_CHAT_ID;
  if (!token || !chatId) return;

  try {
    const res = await fetch(`${TG_API}/bot${token}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      if (!err.includes("message is not modified")) {
        payload.logger.error(`Telegram editMessageText failed: ${res.status} ${err}`);
      }
    }
  } catch (err) {
    payload.logger.error(`Telegram editMessageText error: ${err}`);
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
