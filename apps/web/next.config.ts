import type { NextConfig } from 'next';
import path from 'path';

const withSerwist = (config: NextConfig) => config;

const apiProxyUrl = process.env.API_PROXY_URL || 'http://localhost:4000';

const nextConfig: NextConfig = {
  transpilePackages: ['@haircut-ms/shared'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyUrl}/api/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${apiProxyUrl}/socket.io/:path*`,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, '.');
    return config;
  },
};

export default withSerwist(nextConfig);
