// /app/layout.tsx (データ取得ロジック分離後の最終コード)

import type { Metadata, Viewport } from "next"; 
import { Inter } from "next/font/google";
import { Suspense } from 'react'; 
import "./globals.css"; 
import Script from 'next/script'; // ★ next/script をインポート ★

// コンポーネントのインポート
import Header from './components/Header';
import Footer from './components/Footer';
import CategoryDataFetcher from './components/CategoryDataFetcher'; // ★ 新コンポーネントをインポート ★

// データ取得関数のインポート (CategoryDataFetcherで使用するため残す)
// import { getCategories, getAllMakers } from "@/lib/data"; 

const inter = Inter({ subsets: ["latin"] });

// ★★★ 環境変数から値を取得し、定数として定義 ★★★
const SITE_DOMAIN = process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://bic-saving.com';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'ECサイト';
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
    
    // ★★★ 削除: RootLayoutからデータ取得と safeECCategories の定義ロジックを削除 ★★★
    // const [ecCategories, allMakers] = await Promise.all([...]);
    // const safeECCategories = Array.isArray(ecCategories) ? ecCategories : [];
    // const safeAllMakers = Array.isArray(allMakers) ? allMakers : [];
    // ★★★ ---------------------------------------------------------------------- ★★★


    return (
        <html lang="ja">
            {/* ★★★ Rakuten Automate スクリプトを <head> に相当する場所で読み込む ★★★ */}
            <Script
                src="/public/rakuten_automate.js" // /public/rakuten_automate.js に配置した場合のパス
                strategy="beforeInteractive"
                id="rakuten-automate-script"
            />
            {/* ★★★ ------------------------------------------------------------------ ★★★ */}
            
            <body className={inter.className}>
                
                <Suspense fallback={<div>Loading Header...</div>}>
                    <Header /> 
                </Suspense>
                
                {/* ★★★ メインコンテンツのレイアウト ★★★ */}
                <div className="container mx-auto p-4 page-layout"> 
                    
                    {/* ★ サイドバー (左側) ★ 
                       データ取得は CategoryDataFetcher 内で実行されます。
                    */}
                    <aside className="sidebar"> 
                        {/* ★★★ 修正箇所: CategoryDataFetcher に置き換え ★★★ */}
                        <CategoryDataFetcher />
                        {/* ★★★ ------------------------------------- ★★★ */}
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