import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
    allowedDevOrigins: ["localhost", "127.0.0.1", "api.darksmart.pro", "165.73.252.171"],
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050",
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ]
  },

  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050"}/api/:path*`,
        },
      ],
    }
  },

  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ]
  },

  turbo: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },

  typescript: {
    tsconfigPath: "./tsconfig.json",
  },

  eslint: {
    dirs: ["app", "components", "lib", "server"],
  },

  compress: true,

  productionBrowserSourceMaps: false,

  trailingSlash: false,

  reactStrictMode: true,

  poweredByHeader: false,

  generateEtags: true,
}

export default nextConfig
