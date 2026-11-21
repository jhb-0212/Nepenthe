import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  // 容器里跑 standalone 产物，镜像只带必要文件
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  // 仓库根目录还有一个 package-lock.json（旧 Astro 站），显式指定 Turbopack 的根
  turbopack: { root: path.resolve(process.cwd()) },
  experimental: {
    // Server Actions 请求体上限，相册上传要留量
    serverActions: { bodySizeLimit: '12mb' },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
