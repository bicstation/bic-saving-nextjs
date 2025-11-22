// /app/category/[categoryId]/page.tsx (最終リファクタリング版 - サイドバー削除済み & デバッグログ追加)

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";
import React from "react"; 
import { notFound } from "next/navigation";
import type { Metadata } from "next"; 

// コンポーネントのインポート
import Pagination from "@/app/components/Pagination";
import ProductGrid from "@/app/components/ProductGrid"; 

// データ取得関数のインポート
import { 
    getProductsByCategory, 
    getCategories,
    getCategoryBreadcrumbPath, 
    getCategoryName 
} from "@/lib/data"; 

// 型のインポート
import { ProductData, Category } from "@/types/index"; 

// 環境変数から本番URLを取得
const PRODUCTION_URL = process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://bic-saving.com'; 

// --- 1. コンポーネントPropsの型定義 ---
interface CategoryPageProps {
    params: {
        categoryId: string; 
    };
    searchParams?: { 
        [key: string]: string | string[] | undefined 
    };
}

// --- 2. メタデータの生成 (SEO対策) ---
export async function generateMetadata({ params: awaitedParams, searchParams: awaitedSearchParams }: CategoryPageProps): Promise<Metadata> {
    
    const params = await awaitedParams; 
    const searchParamsObj = (await awaitedSearchParams) || {}; 

    const categoryId = parseInt(params.categoryId, 10);
    const categoryName = await getCategoryName(categoryId);
    
    if (!categoryName) {
            return {
                title: 'カテゴリが見つかりません',
                description: '指定されたカテゴリは存在しないか、データがありません。',
            };
    }
    
    const pageParam = (Array.isArray(searchParamsObj?.page) ? searchParamsObj.page[0] : searchParamsObj?.page) || '1'; 
    const currentPage = parseInt(pageParam, 10);

    const title = `${categoryName} の商品一覧${currentPage > 1 ? ` (Page ${currentPage})` : ''}`;
        
    const description = `${categoryName} に属する人気商品、新着商品を多数掲載中。お得な価格で比較検討できます。`;

    const canonicalUrl = `${PRODUCTION_URL}/category/${categoryId}`; 

    return {
        title: title,
        description: description,
        
        alternates: {
            canonical: canonicalUrl,
        },
        
        openGraph: {
            title: title,
            description: description,
            url: canonicalUrl,
            type: 'website',
        },
    };
}


// --- 3. コンポーネント本体 (型を適用) ---
export default async function CategoryPage({ params: awaitedParams, searchParams: awaitedSearchParams }: CategoryPageProps) {
    
    const params = await awaitedParams; 
    const searchParamsObj = (await awaitedSearchParams) || {}; 
    
    // categoryIdを数値に変換
    const categoryId = parseInt(params.categoryId, 10);
    
    // ページングの処理
    const { page } = searchParamsObj || {};
    const pageParam = (Array.isArray(page) ? page[0] : page) || '1'; 
    const currentPage = parseInt(pageParam, 10);
    const pageSize = 12;

    if (isNaN(categoryId)) {
        return <div className="error-message">無効なカテゴリーIDです。</div>;
    }

    // ★★★ 修正箇所: デバッグログの追加（APIコール直前） ★★★
    console.log(`[DEBUG] Category ID: ${categoryId}, Current Page: ${currentPage}, Page Size: ${pageSize}`);
    // ★★★ ---------------------------------------------------- ★★★
    
    // API通信を実行
    const [productData, breadcrumbPath] = await Promise.all([
        getProductsByCategory({ categoryId, page: currentPage, limit: pageSize }),
        getCategoryBreadcrumbPath(categoryId) 
    ]);
    
    const { products, totalPages } = productData;
    
    // ★★★ 修正箇所: デバッグログの追加（APIコール直後） ★★★
    console.log(`[DEBUG] Total Pages received from API: ${totalPages}`);
    // ★★★ -------------------------------------------------------- ★★★
    
    const currentCategoryName = breadcrumbPath.length > 0 
        ? breadcrumbPath[breadcrumbPath.length - 1].name 
        : `ID: ${categoryId} のカテゴリ`;

    if (breadcrumbPath.length === 0 && products.length === 0) {
        notFound();
    }


    // ★★★ JSON-LD 構造化データ（ItemListスキーマ）の生成 ★★★
    const itemListSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": currentCategoryName + " の商品一覧",
        "itemListElement": products.map((product, index) => ({
            "@type": "ListItem",
            "position": (currentPage - 1) * pageSize + index + 1,
            "url": `${PRODUCTION_URL}/product/${product.id}` 
        }))
    };
    
    // BreadcrumbList スキーマの生成
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "ホーム",
                "item": `${PRODUCTION_URL}/` 
            },
            ...breadcrumbPath.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 2,
                "name": item.name,
                "item": `${PRODUCTION_URL}/category/${item.id}` 
            }))
        ]
    };
    // -----------------------------------------------------------


    return (
        <>
            {/* JSON-LD 構造化データの挿入 */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />

            <main className="page-layout" style={{ 
                display: 'flex', 
                gap: '20px', 
                padding: '20px' }}>
                
                <section className="main-content" style={{ flex: '1' }}>
                    {/* 階層的パンくずリストのレンダリング */}
                    <div className="breadcrumb" style={{ marginBottom: '15px', fontSize: '14px' }}>
                        <Link href="/" style={{ color: '#0070f3' }}>ホーム</Link>
                        
                        {breadcrumbPath.map((item, index) => (
                            <React.Fragment key={item.id}>
                                <span> &gt; </span>
                                {/* 最後のアイテムでなければリンク、最後のアイテムはテキスト */}
                                {index < breadcrumbPath.length - 1 ? (
                                    <Link href={`/category/${item.id}`} style={{ color: '#0070f3' }}>
                                        {item.name}
                                    </Link>
                                ) : (
                                    <span className="current" style={{ fontWeight: 'bold' }}>{item.name}</span>
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    <h1 style={{ fontSize: '28px', marginBottom: '20px' }}>📚 {currentCategoryName} の商品一覧 (Page {currentPage})</h1>

                    {/* 商品リスト (ProductGrid コンポーネントに置き換え) */}
                    {products.length === 0 ? (
                        <p style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>このカテゴリに商品が見つかりませんでした。</p>
                    ) : (
                        <ProductGrid products={products} />
                    )}

                    {/* ページネーション */}
                    <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
                        <Suspense fallback={<div>ページネーション読み込み中...</div>}>
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages} 
                                // カテゴリURLをベースパスとして渡す
                                basePath={`/category/${categoryId}`}
                            />
                        </Suspense>
                    </div>
                </section>
            </main>
        </>
    );
}