import config from "@payload-config";
import {
  convertLexicalToMarkdown,
  convertMarkdownToLexical,
  editorConfigFactory,
} from "@payloadcms/richtext-lexical";

export async function markdownToLexical(markdown: string) {
  const editorConfig = await editorConfigFactory.default({ config: await config });
  return convertMarkdownToLexical({ editorConfig, markdown });
}

/** Round-trip back to markdown so the AI curator can read the owner's own wording. */
export async function lexicalToMarkdown(data: unknown): Promise<string> {
  if (!data || typeof data !== "object") return "";
  const editorConfig = await editorConfigFactory.default({ config: await config });
  return convertLexicalToMarkdown({ editorConfig, data: data as never });
}

/**
 * Ingested links land straight in an `href` on the portfolio pages, and the AI
 * builds them from repo content it does not control (READMEs of forked/external
 * repos). Drop anything that is not plain http(s) so a `javascript:` URL can
 * never become stored XSS.
 */
export function safeLinks(links: unknown): { label: string; url: string; kind?: string }[] {
  if (!Array.isArray(links)) return [];
  return links.flatMap((l) => {
    if (!l || typeof l !== "object") return [];
    const { label, url, kind } = l as Record<string, unknown>;
    if (typeof label !== "string" || typeof url !== "string") return [];
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return [];
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return [];
    return [{ label, url, ...(typeof kind === "string" ? { kind } : {}) }];
  });
}

/** ~200 words/min, min 1. */
export function readingTimeMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
