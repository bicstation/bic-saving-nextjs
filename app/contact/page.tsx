// /app/contact/page.tsx

import type { Metadata } from 'next';
import Script from 'next/script'; // JSON-LD挿入のためにインポート

// ★★★ 修正: 環境変数から本番URLを取得 ★★★
const BASE_URL = process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://bic-saving.com'; 
// ★★★ ---------------------------------- ★★★

// 静的なメタデータの定義
export const metadata: Metadata = {
    title: 'お問い合わせ | Bic Saving ECサイト',
    description: '商品に関するご質問、メディア取材、その他のお問い合わせはこちらからご連絡ください。',
    
    // ★★★ Canonical URLの設定 (環境変数を使用) ★★★
    alternates: {
        canonical: `${BASE_URL}/contact`,
    },
};

export default function ContactPage() {
    // ★★★ JSON-LD 構造化データ（ContactPointスキーマ）の定義 ★★★
    const contactSchema = {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        "url": `${BASE_URL}/contact`, // 環境変数を使用
        "mainContentOfPage": {
            "@type": "ContactPoint",
            "telephone": "+81-03-XXXX-XXXX", // 実際の電話番号
            "contactType": "customer service",
            "areaServed": "JP",
            "availableLanguage": "Japanese"
        }
    };
    
    return (
        <>
            {/* JSON-LD 構造化データの挿入 */}
            {/* Server Component内でNext.jsのScriptコンポーネントを使用し、JSON-LDをheadに追加 */}
            <Script
                id="contact-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
            />
            
            <main className="container mx-auto p-4">
                <h1>📞 お問い合わせ</h1>
                <p className="mt-4">お問い合わせ内容に応じて、以下の連絡先をご利用ください。</p>
                <div className="mt-6">
                    <h2 className="text-xl font-bold">カスタマーサポート</h2>
                    <p>電話番号: 03-XXXX-XXXX</p>
                    <p>メール: support@example.com</p>
                </div>
                {/* ... お問い合わせフォームなどのコンテンツ ... */}
            </main>
        </>
    );
}