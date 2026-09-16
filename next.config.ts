import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.0.0.191', '192.168.2.14', 'localhost:3000'],
  output: 'standalone',
  typescript: {
    // A validação de tipos é feita localmente. Ignorar no build do Docker poupa 1GB+ de RAM na VPS e acelera drasticamente o deploy.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
