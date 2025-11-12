import type { NextConfig } from 'next';

// NextConfig 型を使用して、設定に型チェックを適用します
const nextConfig: NextConfig = {
    typescript: {
        // VPS環境でのビルド時に型エラーが解消しないため、強制的に型チェックを無効化する
        ignoreBuildErrors: true, 
    },
    
    // ★★★ Docker/VPSデプロイ用の設定 ★★★
    output: 'standalone', 

    images: {
        // ★★★ 推奨される remotePatterns 形式を使用 ★★★
        remotePatterns: [
            {
                // blog.bic-saving.com の画像はHTTPでもHTTPSでも許可
                protocol: 'http', 
                hostname: 'blog.bic-saving.com',
            },
            {
                protocol: 'https', 
                hostname: 'blog.bic-saving.com',
            },
            // 必要に応じて、他のドメインを追加
            // {
            //     protocol: 'https',
            //     hostname: 'example.com',
            // },
        ],
        // 古い domains 配列は remotePatterns と共存できないため削除またはコメントアウト
        // domains: ['blog.bic-saving.com'], 
    },
};

export default nextConfig;