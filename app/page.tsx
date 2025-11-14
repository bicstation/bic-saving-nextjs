// /app/page.tsx (最終版)

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";

// コンポーネントのインポート
import Pagination from "./components/Pagination";
import ProductGrid from "./components/ProductGrid";
// import ViewportDisplay from "./components/ViewportDisplay"; // Viewport表示用

// データ取得関数のインポート (RootLayoutで取得済みのカテゴリ/メーカーは不要)
import { getProducts } from "@/lib/data"; 

// 型定義のインポート
import { HomePageProps, ProductData } from "@/types/index"; 

// 環境変数から PRODUCTION_URL を取得
const PRODUCTION_URL = process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://bic-saving.com'; 

// --- 1. メタデータの生成 (SEO対策) ---
export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
    
    // searchParamsの解決を待つ
    const searchParamsObj = (await searchParams) || {};
    const canonicalUrl = `${PRODUCTION_URL}/`; 

    return {
        title: 'トップページ', 
        description: 'BIC-SAVING ECサイトのトップページです。新着商品、人気商品を多数ご覧いただけます。',
        
        alternates: {
            canonical: canonicalUrl,
        },
    };
}

// --- 2. ページコンポーネント本体 (Server Component) ---
export default async function HomePage({ searchParams }: HomePageProps) { 
    
    // searchParamsの解決を待つ
    const searchParamsObj = (await searchParams) || {};
    const { page } = searchParamsObj;

    // ページ番号のクリーンアップと初期値設定
    const pageParam = (Array.isArray(page) ? page[0] : page) || '1'; 
    const currentPage = parseInt(pageParam, 10);
    
    const pageSize = 12;

    // 商品データのみを取得
    const [productData] = await Promise.all([
        getProducts({ 
            page: currentPage, 
            limit: pageSize,
            categoryId: null, // トップページではカテゴリIDを指定しない
            query: null // トップページでは検索クエリを指定しない
        }), 
    ]);

    // 型アサーションを使用してデータ構造を保証
    const { products, totalPages } = productData as ProductData;

    // 構造化データ（Organization/WebSiteスキーマ）の定義
    const siteSchema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "name": "BIC-SAVING Next.js ECサイト", // サイト名
                "url": PRODUCTION_URL,
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": `${PRODUCTION_URL}/?query={search_term_string}`,
                    "query-input": "required name=search_term_string"
                }
            },
            {
                "@type": "Organization",
                "name": "BIC-SAVING", // 組織名
                "url": PRODUCTION_URL,
                "logo": `${PRODUCTION_URL}/og-image.png`,
                "sameAs": []
            }
        ]
    };

    return (
        <>
            {/* JSON-LD 構造化データを出力 */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
            />
            
            {/* ★★★ RootLayoutの <main> タグ内に入るコンテンツのみを返す ★★★ */}
            <section className="min-w-0"> 
                
                {/* ViewportDisplay は Client Component */}
                {/* <ViewportDisplay />  */}

                <div className="breadcrumb text-sm mb-4">
                    <Link href="/">ホーム</Link>
                </div>

                <h2 className="text-3xl font-bold mb-6">🛒 ピックアップ商品 (Page {currentPage})</h2>
                
                {products.length === 0 ? (
                    <p>商品が見つかりませんでした。</p>
                ) : (
                    <ProductGrid products={products} />
                )}

                <Suspense fallback={<div>ページネーション読み込み中...</div>}>
                    <Pagination 
                        totalPages={totalPages} 
                        // basePath="/" // basePathのデフォルト値は現在URLなのでコメントアウト
                    />
                </Suspense>
            </section>
        </>
    );
}