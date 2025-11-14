// /app/layout.tsx (カスタムCSSレイアウト依存版の最終コード)

import type { Metadata, Viewport } from "next"; 
import { Inter } from "next/font/google";
import { Suspense } from 'react'; 
import "./globals.css"; 

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

export const viewport: Viewport = {
    width: 'device-width', 
    initialScale: 1,
    maximumScale: 1, 
};

export const metadata: Metadata = {
    title: {
        template: `%s | ${SITE_NAME}`, // ★ SITE_NAMEを適用 ★
        default: `${SITE_NAME} トップページ`, // ★ SITE_NAMEを適用 ★
    },
    description: 'VPSで構築されたNext.jsベースのECサイト。',
    metadataBase: new URL(SITE_DOMAIN), // ★ SITE_DOMAINを適用 ★
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
                
                {/* ★★★ 修正箇所: レイアウト制御クラスをすべて削除 (Tailwind flex/gap/lg:...) ★★★ 
                    レイアウトは globals.css の .page-layout で制御されます。
                */}
                <div className="container mx-auto p-4 page-layout"> 
                    
                    {/* ★ サイドバー (左側) ★ 
                       width: 280px と flex-shrink: 0 は globals.css の .sidebar が制御。
                    */}
                    <aside className="sidebar"> 
                        <Suspense fallback={<div>Loading Filters...</div>}>
                            <CategorySidebar 
                                categories={safeECCategories}
                                makers={safeAllMakers} 
                            />
                        </Suspense>

                    </aside>
                    
                    {/* ★ メインコンテンツ (右側 - 残りの幅) ★ 
                       flex-grow: 1 と min-width: 0 は globals.css の .main-content が制御。
                    */}
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