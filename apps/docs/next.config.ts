import type { NextConfig } from "next";
import nextra from "nextra";

const withNextra = nextra({});

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: "/docs",
};

export default withNextra(nextConfig);
