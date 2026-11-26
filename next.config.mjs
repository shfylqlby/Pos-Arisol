import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: process.env.NEXT_DIST_DIR || ".next",
  env: {
    NEXT_PUBLIC_LOCAL_MODE: process.env.NEXT_PUBLIC_LOCAL_MODE || "",
  },
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  reactStrictMode: true,
};

export default withSerwist(nextConfig);
