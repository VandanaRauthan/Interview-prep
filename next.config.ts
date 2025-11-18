import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // config options here
  // Image domains allowed for external avatars (Google, GitHub, etc.)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Example for Google avatars
        pathname: "/**",
      },
      // Add other allowed domains here
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  async headers() {
    // Only add this permissive COOP header in development to avoid affecting production security.
    if (process.env.NODE_ENV === "production") return [];

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
