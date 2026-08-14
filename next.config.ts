import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.0.0.191', '192.168.2.14', 'localhost:3000'],
  output: 'standalone',
};

export default nextConfig;
