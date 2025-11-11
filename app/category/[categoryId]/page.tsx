// /app/category/[categoryId]/page.tsx (SEO対策 最終完全版)

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";
import React from "react"; 
import { notFound } from "next/navigation";
import type { Metadata } from "next"; // メタデータ生成のためにインポート

// コンポーネントのインポート
import Pagination from "@/app/components/Pagination";
import CategorySidebar from "@/app/components/CategorySidebar";
import ProductCard from "@/app/components/ProductCard";

// データ取得関数のインポート
import { 
    getProductsByCategory, 
    getCategories,
    getCategoryBreadcrumbPath, // 階層パス取得関数
    getCategoryName // メタデータ生成用に個別の名前を取得
} from "@/lib/data"; 

// 型のインポート
import { ProductData, Category } from "@/types/index"; 

// ★★★ 環境変数から本番URLを取得 ★★★
const PRODUCTION_URL = process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://bic-saving.com'; 

// --- 1. コンポーネントPropsの型定義 ---
interface CategoryPageProps {
    params: {
        categoryId: string; // URLパスから取得するため、常に文字列
    };
    searchParams?: { 
        [key: string]: string | string[] | undefined 
    };
}

// --- 2. メタデータの生成 (SEO対策) ---
// ★修正 1-1: paramsをawaitするために引数を変更し、内部でawaitする
export async function generateMetadata({ params: awaitedParams, searchParams: awaitedSearchParams }: CategoryPageProps): Promise<Metadata> {
    
    const params = await awaitedParams; // ★ Next.js 15 対応 (params await)
    const searchParamsObj = (await awaitedSearchParams) || {}; // Next.js 15 対応 (searchParams await)

    const categoryId = parseInt(params.categoryId, 10);
    const categoryName = await getCategoryName(categoryId);
    
    // カテゴリ名が存在しない場合は、NotFoundを返す代わりに、基本的なメタデータを返す（クロール効率のため）
    if (!categoryName) {
           return {
               title: 'カテゴリが見つかりません',
               description: '指定されたカテゴリは存在しないか、データがありません。',
           };
    }
    
    // 現在のページ番号を取得し、タイトルに含める（ユーザー向け）
    const pageParam = (Array.isArray(searchParamsObj?.page) ? searchParamsObj.page[0] : searchParamsObj?.page) || '1'; 
    const currentPage = parseInt(pageParam, 10);

    const title = `${categoryName} の商品一覧${currentPage > 1 ? ` (Page ${currentPage})` : ''}`;
        
    const description = `${categoryName} に属する人気商品、新着商品を多数掲載中。お得な価格で比較検討できます。`;

    // Canonical URLを決定: ページネーションがあってもカテゴリのルートURLを正規とする
    // 環境変数を使用
    const canonicalUrl = `${PRODUCTION_URL}/category/${categoryId}`; 

    return {
        title: title,
        description: description,
        
        // ★★★ Canonical URLの設定 ★★★
        alternates: {
            canonical: canonicalUrl,
        },
        
        // OGP/Twitterも動的に設定
        openGraph: {
            title: title,
            description: description,
            url: canonicalUrl,
            type: 'website',
        },
    };
}


// --- 3. コンポーネント本体 (型を適用) ---
// ★修正 1-2: paramsをawaitするために引数を変更し、内部でawaitする
export default async function CategoryPage({ params: awaitedParams, searchParams: awaitedSearchParams }: CategoryPageProps) {
    
    const params = await awaitedParams; // ★ Next.js 15 対応 (params await)
    const searchParamsObj = (await awaitedSearchParams) || {}; // Next.js 15 対応 (searchParams await)
    
    // categoryIdを数値に変換 (data.tsで利用)
    const categoryId = parseInt(params.categoryId, 10);
    
    // ページングの処理
    const { page } = searchParamsObj || {};
    const pageParam = (Array.isArray(page) ? page[0] : page) || '1'; 
    const currentPage = parseInt(pageParam, 10);
    const pageSize = 12;

    if (isNaN(categoryId)) {
        return <div className="error-message">無効なカテゴリーIDです。</div>;
    }

    // API通信を実行
    const [productData, categories, breadcrumbPath] = await Promise.all([
        getProductsByCategory({ categoryId, page: currentPage, limit: pageSize }),
        getCategories(), 
        getCategoryBreadcrumbPath(categoryId)
    ]);
    
    const { products, totalPages } = productData;
    const finalCategories = categories;
    const currentCategoryName = breadcrumbPath.length > 0 
        ? breadcrumbPath[breadcrumbPath.length - 1].name 
        : `ID: ${categoryId} のカテゴリ`;

    // カテゴリ名が取得できなかった場合（データなし）
    if (breadcrumbPath.length === 0 && products.length === 0) {
        notFound();
    }


    // ★★★ JSON-LD 構造化データ（ItemListスキーマ）の生成 ★★★
    // ページのアイテムリスト情報を提供
    const itemListSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": currentCategoryName + " の商品一覧",
        "itemListElement": products.map((product, index) => ({
            "@type": "ListItem",
            "position": (currentPage - 1) * pageSize + index + 1,
            "url": `${PRODUCTION_URL}/product/${product.id}` // 環境変数を使用
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
                "item": `${PRODUCTION_URL}/` // 環境変数を使用
            },
            ...breadcrumbPath.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 2,
                "name": item.name,
                "item": `${PRODUCTION_URL}/category/${item.id}` // 環境変数を使用
            }))
        ]
    };
    // -----------------------------------------------------------


    return (
        <>
            {/* ★★★ JSON-LD 構造化データの挿入 ★★★ */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
            />
             <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />

            <main className="page-layout" style={{ display: 'flex', gap: '20px', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
                {/* 2. Sidebar */}
                {/* currentCategoryId を渡すことで、サイドバーで階層を自動展開 */}
                <aside style={{ flex: '0 0 250px' }}>
                    <CategorySidebar 
                        categories={finalCategories} 
                        currentCategoryId={categoryId} 
                    />
                </aside>

                {/* 3. Main Content (商品リストとページネーション) */}
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

                    {/* 商品リスト (グリッド表示) */}
                    {products.length === 0 ? (
                        <p style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>このカテゴリに商品が見つかりませんでした。</p>
                    ) : (
                        <div className="product-grid" style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
                            gap: '20px'
                        }}>
                            {products.map((product) => {
                                if (!product || !product.id || !product.name || !product.price) {
                                    return null;
                                }
                                return (
                                    <ProductCard key={product.id} product={product} />
                                );
                            })}
                        </div>
                    )}

                    {/* ページネーション */}
                    <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
                        <Suspense fallback={<div>ページネーション読み込み中...</div>}>
                            <Pagination totalPages={totalPages} />
                        </Suspense>
                    </div>
                </section>
            </main>
        </>
    );
}