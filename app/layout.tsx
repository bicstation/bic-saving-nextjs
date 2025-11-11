// /app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from 'react'; // ★★★ Suspenseをインポート (エラー対策) ★★★
import "./globals.css";

// ★追加: 分離したコンポーネントをインポート
import Header from './components/Header';
import Footer from './components/Footer';

const inter = Inter({ subsets: ["latin"] });

// ★★★ 警告対策: metadataBaseを環境変数またはデフォルト値で設定 ★★★
// 【修正】環境変数名を NEXT_PUBLIC_PRODUCTION_URL に統一
const SITE_DOMAIN = process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://bic-saving.com';

// ★★★ SEO対策：グローバルなMetadataの定義を強化 ★★★
export const metadata: Metadata = {
    // 0. metadataBaseの設定 (重要): OGP画像の絶対URL解決に必要
    metadataBase: new URL(SITE_DOMAIN),
    
    // 1. タイトル設定
    title: {
        default: "BIC-SAVING Next.js ECサイト",
        template: "%s | BIC-SAVING",
    },
    
    // 2. 基本ディスクリプション
    description: "BIC-SAVING APIを利用した、型安全でモダンなNext.jsによるECサイト開発プロジェクト。お得な商品を見つけましょう！",
    
    // 3. OGP (Open Graph Protocol)
    openGraph: {
        title: "BIC-SAVING Next.js ECサイト",
        description: "BIC-SAVING APIを利用した、型安全でモダンなNext.jsによるECサイト開発プロジェクト。",
        url: SITE_DOMAIN,
        siteName: "BIC-SAVING",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "BIC-SAVING ロゴとスローガン",
            },
        ],
        locale: 'ja_JP',
        type: 'website',
    },
    
    // 4. Twitterカード設定
    twitter: {
        card: 'summary_large_image',
        title: "BIC-SAVING Next.js ECサイト",
        description: "BIC-SAVING APIを利用した、型安全でモダンなNext.jsによるECサイト開発プロジェクト。",
        images: ['/og-image.png'],
    },
    
    // 5. RSSフィードのAlternates設定
    alternates: {
        canonical: '/', 
        // ★★★ 修正済み: RSSの型エラー解消のため 'types' プロパティを使用 ★★★
        types: {
            'application/rss+xml': '/rss.xml', 
        },
    }
};
// ★★★ 対策終了 ★★★

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <body className={inter.className} style={{ margin: 0, padding: 0 }}>
                
                {/* ★★★ 修正: Header自体をSuspenseでラップし、useSearchParamsエラーを回避 ★★★ */}
                <Suspense fallback={<div>Loading Header...</div>}>
                    <Header /> 
                </Suspense>
                
                <main style={{ minHeight: '80vh', padding: '20px' }}>
                    {/* childrenは既にラップされています */}
                    <Suspense fallback={<div>Loading Content...</div>}> 
                        {children}
                    </Suspense>
                </main>
                
                {/* Footerコンポーネント */}
                <Footer /> 

            </body>
        </html>
    );
}