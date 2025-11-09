// /types/index.ts (updated_at 追記修正版)

// --- 1. 商品関連の型 ---

// ★APIから返される生データ用の型 (APIのキー名に合わせる)
export interface ApiProduct {
    id: number;
    product_name: string; // APIキー
    price: string | number; // APIキー (文字列の可能性あり)
    image_url: string; // APIキー
    description?: string | null; // APIキー (nullの可能性も考慮)
    category?: number | null; // 商品リストAPIで使用
    // ★追加: 単一商品APIのレスポンスに対応
    final_category_id?: number | null; 
    // ★★★ 追記: Sitemap, RSS対応のため updated_at を追加 ★★★
    updated_at?: string; 
    [key: string]: any;
}

// ★アプリケーション内部で利用する統一された型 (ロジック・表示に使用)
export interface Product {
    id: number;
    name: string;    // 統一名
    price: number;   // 統一名 (数値に変換済み)
    image: string;   // 統一名
    description?: string;
    category?: number | null; // 統一名 (nullの可能性も考慮)
    // ★★★ 追記: Sitemap, RSS対応のため updated_at を追加 ★★★
    updated_at?: string; 
}

// ProductCardが受け取るPropsの型
export interface ProductCardProps {
    product: Product;
}

// APIから返される商品リストのデータ構造の型
export interface ProductData {
    products: Product[];
    totalPages: number;
}

// --- 2. カテゴリ関連の型 ---

// カテゴリの型
export interface Category {
    id: number;
    name: string;
    category_name?: string; 
    product_count?: number; 
    children?: Category[]; 
}

// --- 3. ページPropsの型 ---

// HomePageコンポーネントが受け取るPropsの型
export interface HomePageProps {
    searchParams?: { [key: string]: string | string[] | undefined };
}