// /app/page.tsx (WordPress API 取得・ページネーション削除・内部リンク修正版)

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import React from "react"; 

// コンポーネントのインポート
import ProductGrid from "./components/ProductGrid";

// データ取得関数のインポート 
import { getProducts } from "@/lib/data"; 

// 型定義のインポート
import { HomePageProps, ProductData } from "@/types/index"; 

// 環境変数から PRODUCTION_URL を取得
const PRODUCTION_URL = process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://bic-saving.com'; 

// WordPressのベースURL
const WORDPRESS_API_BASE = 'https://blog.bic-saving.com/wp-json/wp/v2';

// トップページに表示する商品の固定数と記事数
const TOP_PAGE_PRODUCT_LIMIT = 12;
const POST_COUNT = 3; 

// キャッシュ設定（例: 10分間キャッシュ）
const FETCH_OPTIONS: RequestInit = { next: { revalidate: 600 } }; 

// WordPress APIから返される記事データの基本的な型
interface WpPost {
    id: number;
    slug: string;
    title: { rendered: string };
    date: string;
}

// ★★★ 1. WordPress API から記事を取得する関数 ★★★
/**
 * WordPress APIから最新の記事をフェッチし、表示用に整形する。
 */
async function fetchLatestPosts(): Promise<{ title: string; href: string; date: string; isFeatured: boolean }[]> {
    try {
        const response = await fetch(
            `${WORDPRESS_API_BASE}/posts?_embed&per_page=${POST_COUNT}`, 
            FETCH_OPTIONS
        );

        if (!response.ok) {
            console.error(`WordPress API Error: ${response.status} ${response.statusText}`);
            return [];
        }

        const posts: WpPost[] = await response.json();

        return posts.map(post => {
            // 日付を YYYY.MM.DD 形式に整形
            const formattedDate = new Date(post.date).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).replace(/\//g, '.');

            // 記事リンクのデフォルトパス（スラッグを使用）
            let postHref = `/sale-blog/${post.slug}`;
            
            // ★特定のセール記事のパス上書きロジック
            const specialTitle = "【最大58%OFF！】HPのブラックフライデーセールがアツい！個人・法人別のお得なPCと売れ筋ランキング";
            if (post.title.rendered === specialTitle) {
                 postHref = "/sale-blog/58off-hp-2025-winter-black-friday-saile";
            }
            
            return {
                title: post.title.rendered,
                href: postHref,
                date: formattedDate,
                isFeatured: postHref.includes('sale-blog'), // 特別なパスを持つ記事をフィーチャー
            };
        });

    } catch (error) {
        console.error("Failed to fetch WordPress posts:", error);
        // エラー発生時のフォールバック
        return [{
            title: "記事の取得に失敗しました",
            href: "/sale-blog",
            date: "",
            isFeatured: false,
        }];
    }
}


// --- 2. メタデータの生成 (SEO対策) ---
export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  
  const searchParamsObj = (await searchParams) || {};
  const canonicalUrl = `${PRODUCTION_URL}/`; 

  return {
    title: 'トップページ | BIC-SAVING', 
    description: 'BIC-SAVING ECサイトのトップページです。新着商品、人気商品を多数ご覧いただけます。',
    
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

// --- 3. ページコンポーネント本体 (Server Component) ---
export default async function HomePage({ searchParams }: HomePageProps) { 
  
  // 商品データとブログ記事データを並行して取得
  const [productData, latestPosts] = await Promise.all([
    getProducts({ 
      page: 1, 
      limit: TOP_PAGE_PRODUCT_LIMIT, 
      categoryId: null, 
      query: null 
    }),
    fetchLatestPosts(),
  ]);

  // 型アサーションを使用してデータ構造を保証
  const { products } = productData as ProductData;

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
      {/* JSON-LD 構造化データを出力 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
      />
      
      <div className="min-w-0"> 
        
        {/* --- 1. トップページ用 パンくずリスト --- */}
        <div className="breadcrumb text-sm mb-4">
          <Link href="/">ホーム</Link>
        </div>

        {/* --- 2. 📚 ブログ記事セクション (節約ノウハウと最新情報) --- */}
        <section className="py-8 bg-white border-t border-b">
            <h2 className="text-2xl font-bold mb-4">📚 ビック的節約生活 ノート</h2>
            
            <div className="space-y-3">
                {latestPosts.map((post) => (
                    <div 
                        key={post.href} 
                        className={`p-3 border rounded-lg transition-shadow hover:shadow-md ${post.isFeatured ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'}`}
                    >
                        <Link 
                            href={post.href} 
                            className="flex justify-between items-center"
                        >
                            <span className={`text-base font-medium ${post.isFeatured ? 'text-red-700' : 'text-gray-800'}`}>
                                {post.isFeatured && <span className="mr-2 text-red-500">🔥</span>}
                                {post.title}
                            </span>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-4">
                                {post.date}
                            </span>
                        </Link>
                    </div>
                ))}
            </div>
            
            {/* ブログトップページへの導線 */}
            <div className="mt-4 text-right">
                <Link 
                    href="/sale-blog" 
                    className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                >
                    全ての記事を見る &gt;
                </Link>
            </div>
        </section>

        {/* --- 3. 📉 新着・おすすめ商品セクション --- */}
        <section className="py-8">
            <h2 className="text-2xl font-bold mb-6 mt-4">📉 新着・おすすめ商品</h2>
            
            {products.length === 0 ? (
                <p>商品が見つかりませんでした。</p>
            ) : (
                <ProductGrid products={products} />
            )}

            {/* 「全ての商品を見る」ボタン */}
            <div className="mt-8 flex justify-center">
                 <Link 
                    href="/products" 
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                 >
                    全ての商品を見る (商品一覧へ) &gt;
                </Link>
            </div>
        </section>

      </div>
    </>
  );
}