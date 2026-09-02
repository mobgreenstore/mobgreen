import type { NextConfig } from "next";

const surface = process.env.MOB_GREENS_SURFACE;

const nextConfig: NextConfig = {
  reactCompiler: true,
  distDir: surface === "store" ? ".next-store" : ".next-admin",
  turbopack: { root: process.cwd() },
  experimental: {
    proxyClientMaxBodySize: "52mb",
  },
  async headers() {
    const contentSecurityPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://api.mapbox.com https://cdn.startselect.com https://dundle.com https://company.recharge.com https://www.vidaplayer.com",
      "connect-src 'self' https://api.mapbox.com https://events.mapbox.com",
      "worker-src 'self' blob:",
      "font-src 'self' data:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "cdn.startselect.com" },
      { protocol: "https", hostname: "dundle.com" },
      { protocol: "https", hostname: "company.recharge.com" },
      { protocol: "https", hostname: "www.vidaplayer.com" },
    ],
  },
};

export default nextConfig;
