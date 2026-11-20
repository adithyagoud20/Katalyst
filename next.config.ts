import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";
    return [{
      source: "/:path*",
      headers: [
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ...(isProduction ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
      ],
    }, {
      source: "/((?!lab-runner/c$).*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
      ],
    }, {
      source: "/lab-runner/c/runner.js",
      headers: [
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
      ],
    }, {
      source: "/lab-runner/c/wasmer/:path*",
      headers: [
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
      ],
    }, {
      source: "/vendor/wasmer-sdk/:path*",
      headers: [
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
      ],
    }];
  },
  async rewrites() {
    return [{
      source: "/lab-runner/c/wasmer/:path*",
      destination: "/vendor/wasmer-sdk/:path*",
    }];
  },
};

export default nextConfig;
