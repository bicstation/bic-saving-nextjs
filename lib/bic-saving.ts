// /lib/bic-saving.ts (ECサイトカテゴリ・メーカー・商品取得のためのモジュール)

// ★修正: すべての公開型を @/types/index からインポートする ★
// (このファイル内のローカル定義は削除)
import { Product, Maker, Category } from '@/types/index';


/**
 * APIから返されるトップレベルのカテゴリレスポンス構造
 */
interface CategoryApiResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Category[];
}

// ECサイトのAPIベースURL
const EC_API_BASE_URL = "https://api.bic-saving.com/api/v1/"; 

// ----------------------------------------------------
// ★ メーカー別商品表示のための関数 ★
// ----------------------------------------------------

/**
 * スラッグからメーカー名を取得するヘルパー関数
 */
export function getMakerNameBySlug(makerSlug: string): string | null {
    const makerMap: { [key: string]: string } = {
        'sony': 'ソニー',
        'panasonic': 'パナソニック',
        'sharp': 'シャープ',
        'epson': 'エプソン',
        'canon': 'キヤノン',
        'hp': 'HP (ヒューレット・パッカード)', 
        'dell': 'デル', 
    };
    return makerMap[makerSlug.toLowerCase()] || null;
}

/**
 * メーカーの商品一覧を取得する非同期関数
 * (Product型は外部からインポートされている)
 */
export async function getProductsByMaker(makerSlug: string): Promise<Product[]> {
    
    const makerName = getMakerNameBySlug(makerSlug);
    if (!makerName) {
        return [];
    }
    
    // ★ ダミーデータ (ProductCard/updated_atに対応) ★
    const commonProps = { makerSlug, makerName, updated_at: new Date().toISOString() };
    
    if (makerSlug.toLowerCase() === 'sony') {
        return [
            // 戻り値の型はインポートした Product 型に準拠
            { id: 101, name: "SONY 4Kテレビ BRAVIA X95L", price: 250000, image: '/images/sony-bravia.jpg', category: 'テレビ', ...commonProps },
            { id: 102, name: "SONY ノイズキャンセリングヘッドホン WH-1000XM5", price: 45000, image: '/images/sony-headphone.jpg', category: 'オーディオ', ...commonProps },
        ];
    }
    if (makerSlug.toLowerCase() === 'panasonic') {
        return [
            { id: 201, name: "Panasonic 4Kブルーレイレコーダー", price: 60000, image: '/images/panasonic-recorder.jpg', category: 'AV機器', ...commonProps },
            { id: 202, name: "Panasonic 加湿空気清浄機", price: 35000, image: '/images/panasonic-air-purifier.jpg', category: '生活家電', ...commonProps },
        ];
    }
    return [];
}

/**
 * 全メーカーのリストを取得する関数
 * (Maker型は外部からインポートされている)
 */
export function getAllMakers(): Maker[] {
    const makerMap: { [key: string]: string } = {
        'sony': 'ソニー',
        'panasonic': 'パナソニック',
        'sharp': 'シャープ',
        'epson': 'エプソン',
        'canon': 'キヤノン',
        'hp': 'HP (ヒューレット・パッカード)',
        'dell': 'デル',
    };

    return Object.entries(makerMap).map(([slug, name]) => ({
        slug,
        name
    })).sort((a, b) => a.name.localeCompare(b.name, 'ja'));
}

/**
 * トップページ用のおすすめ商品を取得する非同期関数
 * (Product型は外部からインポートされている)
 */
export async function getFeaturedProducts(): Promise<Product[]> {
    const commonProps = { makerSlug: 'sony', makerName: 'ソニー', updated_at: '2025-11-13T10:00:00Z' };
    
    return [
        { id: 301, name: "人気商品 A (4Kテレビ)", price: 120000, image: '/images/featured/a.jpg', category: 'テレビ', ...commonProps },
        { id: 302, name: "人気商品 B (一眼レフ)", price: 85000, makerSlug: 'canon', makerName: 'キヤノン', image: '/images/featured/b.jpg', category: 'カメラ', updated_at: '2025-11-13T10:00:00Z' },
        { id: 303, name: "人気商品 C (ゲーミングPC)", price: 150000, makerSlug: 'dell', makerName: 'デル', image: '/images/featured/c.jpg', category: 'PC', updated_at: '2025-11-13T10:00:00Z' },
        { id: 304, name: "人気商品 D (ワイヤレスイヤホン)", price: 30000, image: '/images/featured/d.jpg', category: 'オーディオ', ...commonProps },
    ];
}


// ----------------------------------------------------
// ★ 既存のECサイトカテゴリ取得関数 ★
// ----------------------------------------------------

/**
 * ECサイトのトップカテゴリ一覧を取得する非同期関数
 * (Category型は外部からインポートされている)
 */
export async function getTopCategories(): Promise<Category[]> {
    const EC_API_URL = `${EC_API_BASE_URL}categories/`;

    const res = await fetch(EC_API_URL, {
        cache: 'force-cache' 
    });
    
    if (!res.ok) {
        console.error(`Failed to fetch EC categories: ${res.statusText} (${res.status}). Returning empty array.`);
        return []; 
    }

    const data: CategoryApiResponse = await res.json();
    
    return data.results;
}