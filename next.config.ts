import type { NextConfig } from "next";

if (process.env.NODE_ENV === "development") {
  const { initOpenNextCloudflareForDev } =
    await import("@opennextjs/cloudflare");
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    },
    {
      source: "/manifest.json",
      headers: [{ key: "Content-Type", value: "application/manifest+json" }],
    },
  ],
};

export default nextConfig;
