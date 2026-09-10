import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root to this app. It sits next to the backend in a
    // shared parent folder, and pinning it stops Next from inferring a root
    // from any lockfile found higher up.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
