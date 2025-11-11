import type { NextConfig } from 'next';

// NextConfig 型を使用して、設定に型チェックを適用します
const nextConfig: NextConfig = {
  // 以前の設定 (output: 'standalone') をそのまま記述
  output: 'standalone',
};

export default nextConfig;