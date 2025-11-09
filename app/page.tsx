// /app/page.tsx (SEO対策 最終完全版)

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next"; // メタデータ生成のためにインポート

// コンポーネントのインポート
import Pagination from "./components/Pagination";
import CategorySidebar from "./components/CategorySidebar";
import ProductCard from "./components/ProductCard";

// データ取得関数のインポート
import { getProducts, getCategories } from "@/lib/data"; 

// 型定義のインポート
import { HomePageProps, Product } from "@/types/index"; 

// --- 1. メタデータの生成 (SEO対策) ---
export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
    
    // Canonical URLを決定するロジック
    // フィルタリングやページネーションがあっても、ルートURL（/）を正規とする
    const canonicalUrl = 'https://your-production-domain.com/'; // ★★★ 本番URLに修正が必要 ★★★

    return {
        // title, description は layout.tsx のテンプレートが適用される
        title: 'トップページ', 
        description: 'BIC-SAVING ECサイトのトップページです。新着商品、人気商品を多数ご覧いただけます。',
        
        // ★★★ Canonical URLの設定 ★★★
        alternates: {
            canonical: canonicalUrl,
        },
    };
}

// --- 2. ページコンポーネント本体 (Server Component) ---
// HomePageProps を使用して searchParams に型を適用
export default async function HomePage({ searchParams }: HomePageProps) {
    
    // 1. クエリパラメータからページ番号を取得
    const { page } = searchParams || {};

    const pageParam = (Array.isArray(page) ? page[0] : page) || '1'; 
    const currentPage = parseInt(pageParam, 10);
    
    const pageSize = 12;

    // 2. API通信を実行
    // トップページはカテゴリなし、クエリなしで商品を取得
    const [productData, categories] = await Promise.all([
        getProducts({ 
            page: currentPage, 
            limit: pageSize,
            categoryId: null, // カテゴリ指定なし
            query: null       // キーワード検索なし
        }), 
        getCategories(),
    ]);

    const { products, totalPages } = productData;
    const finalCategories = categories;

    // ★★★ 構造化データ（Organization/WebSiteスキーマ）の定義 ★★★
    const siteSchema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                // WebSiteスキーマ: サイト内検索機能のヒントをGoogleに与える
                "@type": "WebSite",
                "name": "BIC-SAVING Next.js ECサイト",
                "url": "https://your-production-domain.com", // ★本番URLに修正
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://your-production-domain.com/?query={search_term_string}", // ★本番URLに修正
                    "query-input": "required name=search_term_string"
                }
            },
            {
                // Organizationスキーマ: サイトの運営元情報
                "@type": "Organization",
                "name": "BIC-SAVING",
                "url": "https://your-production-domain.com", // ★本番URLに修正
                "logo": "https://your-production-domain.com/og-image.png", // ★本番URLに修正
                "sameAs": [] // ソーシャルメディアURLがあればここに追加
            }
        ]
    };
    // -----------------------------------------------------------------


    return (
        <>
            {/* ★★★ JSON-LD 構造化データの挿入 ★★★ */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
            />
            
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
                            {products.map((product: Product) => { // 型アサーションを追加 (Product型として扱う)
                                
                                // データチェック
                                if (
                                    !product ||
                                    !product.id ||
                                    !product.name || 
                                    !product.price
                                ) {
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
        </>
    );
}