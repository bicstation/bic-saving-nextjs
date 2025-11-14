// /app/category/[categoryId]/page.tsx (最終リファクタリング版 - サイドバー削除済み)

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";
import React from "react"; 
import { notFound } from "next/navigation";
import type { Metadata } from "next"; // メタデータ生成のためにインポート

// コンポーネントのインポート
import Pagination from "@/app/components/Pagination";
// import CategorySidebar from "@/app/components/CategorySidebar"; // ★削除★
import ProductGrid from "@/app/components/ProductGrid"; 

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
export async function generateMetadata({ params: awaitedParams, searchParams: awaitedSearchParams }: CategoryPageProps): Promise<Metadata> {
    
    const params = await awaitedParams; 
    const searchParamsObj = (await awaitedSearchParams) || {}; 

    const categoryId = parseInt(params.categoryId, 10);
    const categoryName = await getCategoryName(categoryId);
    
    // カテゴリ名が存在しない場合は、基本的なメタデータを返す
    if (!categoryName) {
            return {
                title: 'カテゴリが見つかりません',
                description: '指定されたカテゴリは存在しないか、データがありません。',
            };
    }
    
    // 現在のページ番号を取得し、タイトルに含める
    const pageParam = (Array.isArray(searchParamsObj?.page) ? searchParamsObj.page[0] : searchParamsObj?.page) || '1'; 
    const currentPage = parseInt(pageParam, 10);

    const title = `${categoryName} の商品一覧${currentPage > 1 ? ` (Page ${currentPage})` : ''}`;
        
    const description = `${categoryName} に属する人気商品、新着商品を多数掲載中。お得な価格で比較検討できます。`;

    // Canonical URLを決定: ページネーションがあってもカテゴリのルートURLを正規とする
    const canonicalUrl = `${PRODUCTION_URL}/category/${categoryId}`; 

    return {
        title: title,
        description: description,
        
        // Canonical URLの設定
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

    // API通信を実行
    // getCategories() はSidebar削除のため不要だが、breadcrumbPathの取得にカテゴリデータが必要な場合があるため、
    // BreadcrumbPathのロジックを確認し、必要であれば残す
    // getCategoryBreadcrumbPath は getCategories() に依存していないため、削除。
    const [productData, breadcrumbPath] = await Promise.all([
        getProductsByCategory({ categoryId, page: currentPage, limit: pageSize }),
        getCategoryBreadcrumbPath(categoryId) // BreadcrumbPathの取得にgetCategories()が内部で呼ばれていると想定し、Promise.allを調整
    ]);
    
    const { products, totalPages } = productData;
    const currentCategoryName = breadcrumbPath.length > 0 
        ? breadcrumbPath[breadcrumbPath.length - 1].name 
        : `ID: ${categoryId} のカテゴリ`;

    // カテゴリ名が取得できなかった場合（データなし）
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

            <main className="page-layout" style={{ 
                display: 'flex', 
                gap: '20px', 
                padding: '20px' }}>
                
                {/* ★★★ Sidebarの領域とレンダリングを完全に削除 ★★★ */}
                {/* 以前のコードでは、CategorySidebarのためのflexコンテナがあったが、
                   Main Contentを全幅にするため、flexレイアウトの構造を変更する */}

                {/* 3. Main Content (全幅) */}
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