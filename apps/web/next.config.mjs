/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async rewrites() {
    const backend = process.env.PWA_TEST_BACKEND_URL?.replace(/\/$/, "");
    if (!backend) return [];
    return {
      beforeFiles: ["/api", "/ws", "/media"].map((prefix) => ({
        source: prefix + "/:path*",
        destination: backend + prefix + "/:path*",
      })),
    };
  },
  async headers() {
    return [{
      source: "/sw.js",
      headers: [
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
        { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'; object-src 'none'" },
      ],
    }];
  },
};

export default nextConfig;
