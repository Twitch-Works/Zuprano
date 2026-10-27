import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root so a stray lockfile in a parent folder doesn't confuse output tracing.
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
  // Product images come from many third-party CDNs, so plain <img> tags are used throughout.
  images: { unoptimized: true },
};

export default nextConfig;
