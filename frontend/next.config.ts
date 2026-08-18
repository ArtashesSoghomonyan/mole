import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Produce a self-contained build in .next/standalone so the Docker
  // runtime image can be minimal (just Node + the built output).
  output: "standalone",
};

export default nextConfig;
