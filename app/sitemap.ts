// /app/sitemap.ts

import { MetadataRoute } from 'next';
import { getProductsCount, getCategories } from '@/lib/data'; // 商品数とカテゴリを取得する関数をインポート

// ★★★ 定数: 環境に合わせて修正してください ★★★
const BASE_URL = 'https://your-production-domain.com'; 
const PRODUCTS_PER_SITEMAP = 50000; // 1つの商品サイトマップファイルに含める商品数（Googleの推奨上限は5万件）
// ★★★ ---------------------------------- ★★★

// 商品IDを特定の範囲で取得するダミー関数
// 実際のプロジェクトでは、APIから取得した総商品数を元に、ページネーション/オフセットを使用して商品IDリストを分割して返す関数が必要です
const getProductIds = async (offset: number, limit: number): Promise<{ id: number }[]> => {
    // 【重要】実際には、ここでAPIを呼び出して商品IDのリストを効率的に取得するロジックを実装します。
    // 例: fetch(`${BASE_URL}/api/products/ids?offset=${offset}&limit=${limit}`)
    
    // ダミーデータ（テスト用）：実際にはDB/APIから取得
    const dummyIds = Array.from({ length: limit }, (_, i) => ({ id: offset + i + 1 }));
    return dummyIds;
};

// --- サイトマップのメインエントリポイント ---
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const categories = await getCategories();
    const totalProducts = await getProductsCount(); // 商品総数を取得する関数
    
    // 1. 静的・カテゴリページのリスト
    const staticAndCategories: MetadataRoute.Sitemap = [
        // トップページ
        { url: BASE_URL, lastModified: new Date(), priority: 1.0 },

        // カテゴリページ
        ...categories.map(category => ({
            url: `${BASE_URL}/category/${category.id}`,
            lastModified: new Date(), // 最終更新日を設定
            priority: 0.8,
        })),

        // 他の静的ページがあれば追加 (例: About, Contactなど)
        // { url: `${BASE_URL}/about`, lastModified: new Date(), priority: 0.5 },
    ];

    // 2. 商品サイトマップインデックスの生成
    const totalMaps = Math.ceil(totalProducts / PRODUCTS_PER_SITEMAP);
    
    const productSitemapIndexes: MetadataRoute.Sitemap = Array.from({ length: totalMaps }, (_, i) => {
        const index = i + 1;
        return {
            // 商品サイトマップのインデックスURLを設定
            url: `${BASE_URL}/sitemap-products-${index}.xml`,
            lastModified: new Date(),
        };
    });

    // メインサイトマップは静的ページと商品サイトマップインデックスを結合して返します
    return [...staticAndCategories, ...productSitemapIndexes];
}