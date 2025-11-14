// /app/layout.tsx (修正案)

import type { Metadata, Viewport } from "next"; 
import { Inter } from "next/font/google";
import { Suspense } from 'react'; 
import "./globals.css"; 
// ★ next/script をインポート ★
import Script from 'next/script'; 

// コンポーネントのインポート
import Header from './components/Header';
import Footer from './components/Footer';
import CategorySidebar from './components/CategorySidebar'; // サイドバー

// データ取得関数のインポート
import { getCategories, getAllMakers } from "@/lib/data"; // データ取得

const inter = Inter({ subsets: ["latin"] });

// ★★★ 環境変数から値を取得し、定数として定義 ★★★
const SITE_DOMAIN = process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://bic-saving.com';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'ECサイト';
// ★★★ ----------------------------------------- ★★★

// --- Viewport & Metadata ---
// ... (Viewport & Metadata の定義は省略) ...


// --- Root Layout Component ---

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    
    // ... (データ取得ロジックは省略) ...

    return (
        <html lang="ja">
            {/* ★★★ Rakuten Automate スクリプトを <head> に相当する場所で読み込む ★★★ */}
            {/* strategy="beforeInteractive" で、可能な限り早くロードさせます。 */}
            <Script
                src="/rakuten_automate.js" // /public/rakuten_automate.js に配置した場合のパス
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
                    
                    {/* ★ サイドバー (左側) ★ */}
                    <aside className="sidebar"> 
                        <Suspense fallback={<div>Loading Filters...</div>}>
                            <CategorySidebar 
                                categories={safeECCategories}
                                makers={safeAllMakers} 
                            />
                        </Suspense>
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