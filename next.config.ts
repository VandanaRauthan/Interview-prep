import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // config options here
  // If you need images config, uncomment
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: "https",
  //       hostname: "ik.imagekit.io",
  //     },
  //   ],
  // },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
