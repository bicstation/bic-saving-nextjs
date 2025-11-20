// /app/layout.tsx (データ取得ロジック分離後の最終コード)

import type { Metadata, Viewport } from "next"; 
import { Inter } from "next/font/google";
import { Suspense } from 'react'; 
import "./globals.css"; 
import Script from 'next/script'; 

// コンポーネントのインポート
import Header from './components/Header';
import Footer from './components/Footer';
import CategoryDataFetcher from './components/CategoryDataFetcher'; 

// ★★★ GAコンポーネントのインポートを追記 (components/GoogleAnalytics.tsxを別途作成した場合) ★★★
import { GoogleAnalytics } from '@/components/GoogleAnalytics'; 

const inter = Inter({ subsets: ["latin"] });

// ★★★ 環境変数から値を取得し、定数として定義 ★★★
const SITE_DOMAIN = process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://bic-saving.com';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'ECサイト';
const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID; // 👈 GAトラッキングIDを取得
// ★★★ ----------------------------------------- ★★★

// --- Viewport & Metadata ---

export const viewport: Viewport = {
    width: 'device-width', 
    initialScale: 1,
    maximumScale: 1, 
};

export const metadata: Metadata = {
    title: {
        template: `%s | ${SITE_NAME}`, 
        default: `${SITE_NAME} トップページ`, 
    },
    description: 'VPSで構築されたNext.jsベースのECサイト。',
    metadataBase: new URL(SITE_DOMAIN), 
    alternates: { canonical: SITE_DOMAIN },
    robots: { index: true, follow: true },
};


// --- Root Layout Component ---

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    
    return (
        <html lang="ja">
            {/* ★★★ GA4トラッキングスクリプトを <head> に相当する場所で読み込む ★★★ 
            next/script の strategy="afterInteractive" を使用し、ページがインタラクティブになった後にロード
            */}
            {GA_TRACKING_ID && (
                <>
                    {/* 測定ID設定のためのdataLayer初期化スクリプト */}
                    <Script
                        strategy="afterInteractive" 
                        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
                    />
                    
                    {/* Google Analytics の設定と初期化 */}
                    <Script
                        id="google-analytics-script"
                        strategy="afterInteractive"
                        dangerouslySetInnerHTML={{
                            __html: `
                                window.dataLayer = window.dataLayer || [];
                                function gtag(){dataLayer.push(arguments);}
                                gtag('js', new Date());
                                gtag('config', '${GA_TRACKING_ID}');
                            `,
                        }}
                    />
                </>
            )}
            {/* ★★★ ------------------------------------------------------------------ ★★★ */}
            
            <body className={inter.className}>
                
                {/* ★★★ ルーティング変更時のトラッキングコンポーネントを配置 (Suspenseで囲む) ★★★ */}
                {GA_TRACKING_ID && (
                    <Suspense fallback={null}> 
                        <GoogleAnalytics /> 
                    </Suspense>
                )}
                
                <Suspense fallback={<div>Loading Header...</div>}>
                    <Header /> 
                </Suspense>
                
                {/* ★★★ メインコンテンツのレイアウト ★★★ */}
                <div className="container mx-auto p-4 page-layout"> 
                    
                    {/* ★ サイドバー (左側) ★ */}
                    <aside className="sidebar"> 
                        {/* CategoryDataFetcher が useSearchParams を使っていなければ Suspense は不要 */}
                        <CategoryDataFetcher />
                    </aside>
                    
                    {/* ★ メインコンテンツ (右側 - 残りの幅) ★ */}
                    <main 
                        className="main-content" 
                        style={{ minHeight: '80vh' }}
                    >
                        <Suspense fallback={<div>Loading Content...</div>}> 
                            {children}
                        </Suspense>
                    </main>
                    
                </div>
                
                <Footer /> 

            </body>
        </html>
    );
}