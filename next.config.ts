import type { NextConfig } from "next";
import { parseEmbedOrigins, securityHeaders } from "./src/lib/security-headers";

// Framing is off unless the owner lists approved LMS origins, e.g.
// EMBED_ALLOWED_ORIGINS="https://canvas.example.edu https://moodle.example.edu"
// (exact https origins only; see docs/institutional/lms-integration.md).
const embed = parseEmbedOrigins(process.env.EMBED_ALLOWED_ORIGINS);
if (embed.rejected.length) {
  console.warn(`EMBED_ALLOWED_ORIGINS: ignored invalid entries ${embed.rejected.join(", ")} (exact https origins only)`);
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Short lab addresses used in the V2 prototypes and early handouts.
  async redirects() {
    return [
      { source: "/lab/sampling", destination: "/lab/sampling-universe", permanent: true },
      { source: "/lab/ttest", destination: "/lab/ttest-lab", permanent: true },
      { source: "/lab/ci", destination: "/lab/ci-explorer", permanent: true },
      { source: "/lab/survey-weighting", destination: "/lab/survey-weighting-studio", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({ embedOrigins: embed.origins, dev: process.env.NODE_ENV === "development" }),
      },
    ];
  },
};

export default nextConfig;
