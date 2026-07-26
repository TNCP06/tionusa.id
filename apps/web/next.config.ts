import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

// Not using `output: standalone` — Next's file tracer misses Payload's
// dynamically-required sqlite driver (libsql). The Docker image ships prod
// node_modules instead (see apps/web/Dockerfile).
const nextConfig: NextConfig = {
  // The homepage suspends on Payload data, so Next streams <title>/<meta> out
  // after </head>. Googlebot is not in Next's default HTML-limited bot list, and
  // it ignored the late tags — SERP showed the <h1> and a portfolio paragraph
  // instead. Adding Googlebot forces a blocking metadata render for it.
  // Rest of the list mirrors Next's HTML_LIMITED_BOT_UA_RE, which this replaces.
  htmlLimitedBots:
    /Googlebot|Google-InspectionTool|Mediapartners-Google|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti/i,
};

export default withPayload(nextConfig);
