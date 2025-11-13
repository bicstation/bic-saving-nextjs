// /app/layout.tsx (全幅化とレイアウト整理)

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from 'react'; 
import "./globals.css";

// コンポーネントのインポート
import Header from './components/Header';
import Footer from './components/Footer';
import ProductSidebar from "./components/ProductSidebar"; 
// データ取得関数のインポート
import { getWPCategories, getWPTags } from "@/lib/wordpress"; 
import { getCategories, getAllMakers } from "@/lib/data"; 

const inter = Inter({ subsets: ["latin"] });
const SITE_DOMAIN = process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://bic-saving.com';
export const metadata: Metadata = {
    // ... metadata の定義は省略 ...
};


export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    
    const [wpCategories, ecCategories, wpTags, makers] = await Promise.all([
        getWPCategories().catch(() => []), 
        getCategories().catch(() => []), 
        getWPTags().catch(() => []), 
        getAllMakers().catch(() => []), 
    ]);

    const safeECCategories = Array.isArray(ecCategories) ? ecCategories : [];
    const safeMakers = Array.isArray(makers) ? makers : [];

    return (
        <html lang="ja">
            <body className={inter.className} style={{ margin: 0, padding: 0 }}>
                
                <Suspense fallback={<div>Loading Header...</div>}>
                    <Header /> 
                </Suspense>
                
                {/* ★★★ 修正点: 全幅を維持しつつ、左右の余白はメインコンテンツ内で調整 ★★★ */}
                <div className="main-layout" style={{ 
                    display: 'flex', 
                    width: '100%',
                    // 外側の padding を削除し、コンテンツ間の gap のみ残す
                    margin: '0', 
                    padding: '20px 0' // 上下のパディングは維持
                }}>
                    
                    {/* 1. ECサイトのProductSidebar (左側のナビゲーション) - w-1/4 */}
                    {/* ★★★ 修正点: 左右に10pxのパディングを追加して、全体に余白を作る ★★★ */}
                    <aside className="ec-sidebar w-1/4" style={{ padding: '0 10px 0 20px' }}>
                        <ProductSidebar 
                            categories={safeECCategories} 
                            makers={safeMakers}           
                            currentCategoryId={null}      
                            currentMakerSlug={undefined}  
                        />
                    </aside>
                    
                    {/* 2. メインコンテンツ - w-3/4 */}
                    {/* ★★★ 修正点: 右側に20pxのパディングを追加して、右端の余白を作る ★★★ */}
                    <main className="main-content w-3/4" style={{ 
                        flex: 1, 
                        minHeight: '80vh', 
                        padding: '0 20px 20px 10px' // 上右下左の順。左側はサイドバーとの間に10px
                    }}>
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