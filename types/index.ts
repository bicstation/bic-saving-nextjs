// /types/index.ts (最終修正版: 型の完全統合)

// --- 1. 商品関連の型 ---

// ★APIから返される生データ用の型
export interface ApiProduct {
  id: number;
  product_name: string;
  price: string | number;
  image_url: string;
  description?: string | null;
  category?: number | null; 
  final_category_id?: number | null; 
  updated_at?: string;
  // ★修正: APIレスポンスに含まれるアフィリエイトURL
  product_url?: string | null; 
  [key: string]: any;
}

// ★アプリケーション内部で利用する統一された型 (ロジック・表示に使用)
export interface Product {
  // ★修正1: /lib/bic-saving.ts のダミーデータに合わせ、string | number を許容
  id: number | string; 
  name: string;  
  price: number;  
  // ★修正2: /lib/bic-saving.ts のダミーデータに合わせ、必須ではない場合は '?' をつける
  image?: string;  
  description?: string;
  
  // ★修正3: /lib/lib/bic-saving.ts で使用され、MakerPageに渡されていたプロパティを追加 ★
  makerSlug: string; 
  makerName: string; 
  
  // category の型を柔軟にし、/lib/bic-saving.ts との不整合を解消
  category?: string | number | null; 
  
  // Sitemap, RSS対応のため updated_at を追加
  updated_at?: string; 

  // ★修正: アフィリエイトリンク用URL (DBのカラム名に合わせる)
  product_url?: string | null;
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

// --- 2. カテゴリ・メーカー関連の型 ---

// カテゴリの型
export interface Category {
  id: number;
  name: string;
  category_name?: string; 
  product_count?: number; 
  children?: Category[]; 
}

// ★修正4: Maker型も /types/index に定義し、/lib/bic-saving.ts でインポートできるようにする ★
export interface Maker {
  name: string;
  slug: string;
}

// --- 3. ページPropsの型 ---

// HomePageコンポーネントが受け取るPropsの型
export interface HomePageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}