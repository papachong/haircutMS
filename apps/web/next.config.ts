import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@haircut-ms/shared'],
  outputFileTracingRoot: '/Users/mac/AI_Dev/haircutMS/.claude/worktrees/frontend-member-recharge',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
