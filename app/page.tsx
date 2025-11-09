// /app/page.tsx (最終クリーンアップ版)

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";

// 拡張子を削除することで、Next.jsが自動的に .tsx を解決する
import Pagination from "./components/Pagination";
import CategorySidebar from "./components/CategorySidebar";
import ProductCard from "./components/ProductCard";

// /lib/data.ts に戻り値の型が定義されたため、型アサーションは不要になりました
import { getProducts, getCategories } from "@/lib/data"; 

// すべての型を外部ファイルからインポート
import { Product, ProductData, Category, HomePageProps } from "@/types/index"; 

// --- コンポーネント本体 (型を適用) ---

// HomePageProps を使用して searchParams に型を適用
export default async function HomePage({ searchParams }: HomePageProps) {
    // searchParamsを直接デストラクチャリング
    const { page } = searchParams || {};

    // 取り出した page の値を処理
    const pageParam = (Array.isArray(page) ? page[0] : page) || '1'; 
    const currentPage = parseInt(pageParam, 10);
    
    const pageSize = 12;

    // API通信を実行
    // ★★★ 修正箇所: 型アサーション (as Promise<...>) を削除 ★★★
    const [productData, categories] = await Promise.all([
        getProducts({ page: currentPage, limit: pageSize }), 
        getCategories(),
    ]);

    // ★★★ 修正箇所: 型アサーション (as ... ) を削除 ★★★
    // /lib/data.ts の戻り値の型定義により、productDataとcategoriesは適切な型を持つ
    const { products, totalPages } = productData;
    const finalCategories = categories;


    return (
        <main className="page-layout">
            {/* 2. Sidebar */}
            <CategorySidebar categories={finalCategories} />

            {/* 3. Main Content (商品リストとページネーション) */}
            <section className="main-content">
                {/* パンくずリスト (トップページでは「ホーム」のみ) */}
                <div className="breadcrumb">
                    <Link href="/">ホーム</Link>
                </div>

                <h2>🛒 ピックアップ商品 (Page {currentPage})</h2>

                {/* デバッグ情報: 現在のページ番号を表示 */}
                <div
                    style={{
                        padding: "10px",
                        backgroundColor: "#fffbe5",
                        border: "1px solid #ffe680",
                        marginBottom: "20px",
                    }}
                >
                    <strong>デバッグ情報:</strong> URLから認識されたページ番号は
                    <span style={{ color: "red", fontWeight: "bold" }}>
                        {" "}
                        {currentPage}{" "}
                    </span>{" "}
                    です。
                </div>
                
                {/* 商品リスト (グリッド表示) */}
                {products.length === 0 ? (
                    <p>商品が見つかりませんでした。</p>
                ) : (
                    <div className="product-grid">
                        {products.map((product) => {
                            // TypeScriptによって product が Product 型であると認識される
                            // ★★★ この防御コードは、APIレスポンスの信頼性が低い場合に残すことができます ★★★
                            if (
                                !product ||
                                !product.id ||
                                !product.product_name ||
                                !product.price
                            ) {
                                return null;
                            }

                            // product は Product 型として ProductCard に渡される
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