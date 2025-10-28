import { format } from "date-fns";
import nextra from "nextra";
import type { NextConfig } from "next";
import path from "path";

const withNextra = nextra({});

const nextConfig: NextConfig = {};

const proxy = async () => {
  return [
    {
      source: "/api/:path*",
      destination: "http://localhost:8000/api/:path*",
    },
  ];
};

switch (process.env.NODE_ENV) {
  case "production":
    nextConfig.output = "export";
    nextConfig.images = { unoptimized: true };
    nextConfig.distDir = "dist";
    break;
  case "development":
    nextConfig.rewrites = proxy;
    break;
}

nextConfig.turbopack = {
  resolveAlias: {
    "next-mdx-import-source-file": "./mdx-components",
  },
};

nextConfig.webpack = (config) => {
  const alias = config.resolve.alias ?? {};
  const existing = alias["next-mdx-import-source-file"];
  const ensureArray = Array.isArray(existing)
    ? existing
    : existing
      ? [existing]
      : [];
  alias["next-mdx-import-source-file"] = [
    path.join(process.cwd(), "mdx-components"),
    path.join(process.cwd(), "src", "mdx-components"),
    ...ensureArray,
  ];
  config.resolve.alias = alias;
  return config;
};

process.env.NEXT_PUBLIC_BUILD_TIME = format(new Date(), "yyyy-MM-dd HH:mm");

export default withNextra(nextConfig);
