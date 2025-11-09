// /app/about/page.tsx

import type { Metadata } from 'next';

// ★★★ 定数: 環境に合わせて修正してください ★★★
const BASE_URL = 'https://your-production-domain.com'; 
// ★★★ ---------------------------------- ★★★

// 静的なメタデータの定義
export const metadata: Metadata = {
    title: '会社概要 | Bic Saving ECサイト',
    description: '当社の企業理念、沿革、事業内容をご紹介します。信頼と安心のECサイト運営を目指しています。',
    
    // ★★★ Canonical URLの設定 ★★★
    alternates: {
        canonical: `${BASE_URL}/about`,
    },
    
    openGraph: {
        title: '会社概要 | Bic Saving ECサイト',
        description: '当社の企業理念、沿革、事業内容をご紹介します。',
        url: `${BASE_URL}/about`,
        type: 'website',
    },
};

export default function AboutPage() {
    return (
        <main className="container mx-auto p-4">
            <h1>🏢 会社概要</h1>
            <section className="mt-6">
                <h2 className="text-xl font-bold">企業理念</h2>
                <p>「最高の品質を、すべての人へ」をモットーに、デジタルとリアルの架け橋となるECサービスを提供します。</p>
            </section>
            {/* ... その他のコンテンツ ... */}
        </main>
    );
}