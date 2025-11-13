// /app/layout.tsx (サイドバー付き全幅表示 修正版)

import type { Metadata, Viewport } from "next"; 
import { Inter } from "next/font/google";
import { Suspense } from 'react'; 
import "./globals.css"; 

// コンポーネントのインポート
import Header from './components/Header';
import Footer from './components/Footer';
import CategorySidebar from './components/CategorySidebar'; // ★サイドバー復活★

// データ取得関数のインポート
import { getCategories, getAllMakers } from "@/lib/data"; // ★データ取得復活★

const inter = Inter({ subsets: ["latin"] });
const SITE_DOMAIN = process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://bic-saving.com';


// --- Viewport & Metadata ---
// ... (変更なし)

export const viewport: Viewport = {
    width: 'device-width', 
    initialScale: 1,
    maximumScale: 1, 
};

export const metadata: Metadata = {
    title: {
        template: '%s | BIC-SAVING ECサイト',
        default: 'BIC-SAVING ECサイト トップページ',
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
    
    // カテゴリとメーカーのデータを並行取得
    const [ecCategories, allMakers] = await Promise.all([
        getCategories().catch(() => []), 
        getAllMakers().catch(() => []),
    ]);
    const safeECCategories = Array.isArray(ecCategories) ? ecCategories : [];
    const safeAllMakers = Array.isArray(allMakers) ? allMakers : [];

    return (
        <html lang="ja">
            <body className={inter.className}>
                
                <Suspense fallback={<div>Loading Header...</div>}>
                    <Header /> 
                </Suspense>
                
                {/* ★修正: 2カラムレイアウトを復活 (globals.cssで max-width を広げる) ★ */}
                <div className="container page-layout"> 
                    
                    {/* ★ サイドバー (左側) ★ */}
                    <aside className="sidebar"> 
                        <Suspense fallback={<div>Loading Filters...</div>}>
                            <CategorySidebar 
                                categories={safeECCategories}
                                makers={safeAllMakers} 
                            />
                        </Suspense>
                    </aside>
                    
                    {/* ★ メインコンテンツ (右側) ★ */}
                    <main 
                        className="main-content" 
                        style={{ minHeight: '80vh', padding: '20px 0 20px 20px' }}
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