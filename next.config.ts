import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  ...(process.env.MISSIONPULSE_AUTH_FIXTURE === "1"
    ? {
        distDir: ".next-auth-tests",
        typescript: { tsconfigPath: "tsconfig.auth-fixture.json" },
      }
    : {}),
  reactStrictMode: true,
  poweredByHeader: false,
};
export default nextConfig;
