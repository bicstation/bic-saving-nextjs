// /types/index.ts

// --- 1. 商品関連の型 ---

// APIから返される一つの商品オブジェクトの型
export interface Product {
    id: number;
    product_name: string;
    price: string; // APIから文字列として返される可能性を考慮
    
    // ProductCard.tsx で利用されているため追加
    image_url: string; 
}

// ProductCardが受け取るPropsの型
export interface ProductCardProps {
    product: Product;
}

// APIから返される商品リストのデータ構造の型
export interface ProductData {
    products: Product[];
    totalPages: number;
    // ... APIレスポンスにある他のフィールド（例: count, next, previous）
}

// --- 2. カテゴリ関連の型 ---

// カテゴリの型 (CategorySidebar.tsx に対応)
export interface Category {
    id: number;
    name: string;
    // APIによっては name の代わりに category_name が使われる可能性がある
    category_name?: string; 
    
    // CategorySidebarでソート・表示に利用
    product_count?: number; 
    
    // CategorySidebarでアコーディオン表示に利用 (再帰的)
    children?: Category[]; 
}

// --- 3. ページPropsの型 ---

// HomePageコンポーネントが受け取るPropsの型
export interface HomePageProps {
    // searchParamsの型は Next.jsの規約に従い定義
    searchParams?: { [key: string]: string | string[] | undefined };
}