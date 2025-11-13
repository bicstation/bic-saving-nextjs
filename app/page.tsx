// /app/page.tsx (リファクタリング最終版)

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";

// コンポーネントのインポート
import Pagination from "./components/Pagination";
import ProductGrid from "./components/ProductGrid";

// データ取得関数のインポート
import { getProducts, getCategories } from "@/lib/data"; 

// 型定義のインポート
import { HomePageProps } from "@/types/index"; 

const PRODUCTION_URL = process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://bic-saving.com'; 

// --- 1. メタデータの生成 (SEO対策) ---
export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
    
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
    
    const searchParamsObj = (await searchParams) || {};
    const { page } = searchParamsObj;

    const pageParam = (Array.isArray(page) ? page[0] : page) || '1'; 
    const currentPage = parseInt(pageParam, 10);
    
    const pageSize = 12;

    const [productData, categories] = await Promise.all([
        getProducts({ 
            page: currentPage, 
            limit: pageSize,
            categoryId: null,
            query: null
        }), 
        getCategories(),
    ]);

    const { products, totalPages } = productData;
    const finalCategories = categories;

    // 構造化データ（Organization/WebSiteスキーマ）の定義
    const siteSchema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "name": "BIC-SAVING Next.js ECサイト",
                "url": PRODUCTION_URL,
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": `${PRODUCTION_URL}/?query={search_term_string}`,
                    "query-input": "required name=search_term_string"
                }
            },
            {
                "@type": "Organization",
                "name": "BIC-SAVING",
                "url": PRODUCTION_URL,
                "logo": `${PRODUCTION_URL}/og-image.png`,
                "sameAs": []
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
            />
            
            <main className="page-layout">
                <section className="main-content">
                    <div className="breadcrumb">
                        <Link href="/">ホーム</Link>
                    </div>

                    <h2>🛒 ピックアップ商品 (Page {currentPage})</h2>
                    
                    {products.length === 0 ? (
                        <p>商品が見つかりませんでした。</p>
                    ) : (
                        <ProductGrid products={products} />
                    )}

                    <Suspense fallback={<div>ページネーション読み込み中...</div>}>
                        <Pagination totalPages={totalPages} />
                    </Suspense>
                </section>
            </main>
        </>
    );
}