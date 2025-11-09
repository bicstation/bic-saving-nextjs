// /app/category/[categoryId]/page.tsx

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";
import React from "react"; 

// コンポーネントのインポート
import Pagination from "@/app/components/Pagination";
import CategorySidebar from "@/app/components/CategorySidebar";
import ProductCard from "@/app/components/ProductCard";

// データ取得関数のインポート
import { 
    getProductsByCategory, 
    getCategories,
    getCategoryBreadcrumbPath // 階層パス取得関数
} from "@/lib/data"; 

// 型のインポート
import { ProductData, Category } from "@/types/index"; 

// --- 1. コンポーネントPropsの型定義 ---
interface CategoryPageProps {
    params: {
        categoryId: string; // URLパスから取得するため、常に文字列
    };
    searchParams?: { 
        [key: string]: string | string[] | undefined 
    };
}

// --- 2. コンポーネント本体 (型を適用) ---
export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
    
    // categoryIdを数値に変換 (data.tsで利用)
    const categoryId = parseInt(params.categoryId, 10);
    
    // ページングの処理
    const { page } = searchParams || {};
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
    // 現在のカテゴリ名をパスの最後のアイテムから取得
    const currentCategoryName = breadcrumbPath.length > 0 
        ? breadcrumbPath[breadcrumbPath.length - 1].name 
        : `ID: ${categoryId} のカテゴリ`;


    return (
        <main className="page-layout">
            {/* 2. Sidebar */}
            {/* ★★★ 修正箇所: currentCategoryId を渡すことで、サイドバーで階層を自動展開 ★★★ */}
            <CategorySidebar 
                categories={finalCategories} 
                currentCategoryId={categoryId} 
            />

            {/* 3. Main Content (商品リストとページネーション) */}
            <section className="main-content">
                {/* 階層的パンくずリストのレンダリング */}
                <div className="breadcrumb">
                    <Link href="/">ホーム</Link>
                    
                    {breadcrumbPath.map((item, index) => (
                        <React.Fragment key={item.id}>
                            <span> &gt; </span>
                            {/* 最後のアイテムでなければリンク、最後のアイテムはテキスト */}
                            {index < breadcrumbPath.length - 1 ? (
                                <Link href={`/category/${item.id}`}>
                                    {item.name}
                                </Link>
                            ) : (
                                <span className="current">{item.name}</span>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <h2>📚 {currentCategoryName} の商品一覧 (Page {currentPage})</h2>

                {/* 商品リスト (グリッド表示) */}
                {products.length === 0 ? (
                    <p>このカテゴリに商品が見つかりませんでした。</p>
                ) : (
                    <div className="product-grid">
                        {products.map((product) => {
                            if (!product || !product.id || !product.product_name || !product.price) {
                                return null;
                            }
                            return (
                                <ProductCard key={product.id} product={product} />
                            );
                        })}
                    </div>
                )}

                {/* ページネーション */}
                <Suspense fallback={<div>ページネーション読み込み中...</div>}>
                    <Pagination totalPages={totalPages} />
                </Suspense>
            </section>
        </main>
    );
}