/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  basePath: isProd ? "/BestShotArchive" : undefined,
  assetPrefix: isProd ? "/BestShotArchive/" : undefined,
};

export default nextConfig;
