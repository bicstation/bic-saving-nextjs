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

// ★★★ 環境変数から本番URLを取得 ★★★
const PRODUCTION_URL = process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://bic-saving.com'; 

// --- 1. メタデータの生成 (SEO対策) ---
export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
    
    // 【修正】Next.js 15 対応: searchParams に await を追加
    const searchParamsObj = (await searchParams) || {};
    // const { page } = searchParamsObj; // pageはここでは未使用ですが、変数取得の型安全のため残す

    // Canonical URLを決定するロジック
    // 【修正】環境変数を使用
    const canonicalUrl = `${PRODUCTION_URL}/`; 

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
export default async function HomePage({ searchParams }: HomePageProps) { // 👈 async は既に付与済み
    
    // 1. クエリパラメータからページ番号を取得
    // 【修正】Next.js 15 対応: searchParams に await を追加 (完了済み)
    const searchParamsObj = (await searchParams) || {};
    const { page } = searchParamsObj;

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
            query: null      // キーワード検索なし
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
                "url": PRODUCTION_URL, // 【修正】環境変数を使用
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": `${PRODUCTION_URL}/?query={search_term_string}`, // 【修正】環境変数を使用
                    "query-input": "required name=search_term_string"
                }
            },
            {
                // Organizationスキーマ: サイトの運営元情報
                "@type": "Organization",
                "name": "BIC-SAVING",
                "url": PRODUCTION_URL, // 【修正】環境変数を使用
                "logo": `${PRODUCTION_URL}/og-image.png`, // 【修正】環境変数を使用
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