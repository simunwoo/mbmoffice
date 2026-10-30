import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.imweb.me" },
      { protocol: "https", hostname: "cdn-optimized.imweb.me" },
      { protocol: "https", hostname: "mblogthumb-phinf.pstatic.net" },
      { protocol: "https", hostname: "postfiles.pstatic.net" },
      { protocol: "https", hostname: "blogthumb.pstatic.net" },
      { protocol: "https", hostname: "blogthumb-phinf.pstatic.net" },
      { protocol: "https", hostname: "dthumb-phinf.pstatic.net" },
      { protocol: "https", hostname: "storep-phinf.pstatic.net" },
    ],
  },
};

export default nextConfig;
