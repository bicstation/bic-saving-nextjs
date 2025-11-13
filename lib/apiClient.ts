// lib/apiClient.ts

// .envファイルから環境変数を読み込む
// NEXT_PUBLIC_API_BASE_URLを使用し、/api/v1 を追記
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + '/api/v1'; 

// ==============================================================================
// 1. 汎用的なGETリクエスト関数
// ==============================================================================
/**
 * 汎用的なGETリクエスト関数
 * @param endpoint - /makers や /products?maker=slug のようなエンドポイント
 */
export async function fetchApiData<T>(endpoint: string): Promise<T> {
  // endpointはスラッシュで始まることを想定
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      // Next.jsのキャッシュ設定 (App Routerのfetchオプション)
      next: { revalidate: 3600 } // 1時間ごとに再検証
    });

    if (!response.ok) {
      // エラーメッセージにURLを含めることでデバッグを容易にする
      throw new Error(`APIリクエストが失敗しました: ${response.status} ${response.statusText} (${url})`);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    console.error('APIデータの取得中にエラーが発生しました:', error);
    // エラーを再スローし、呼び出し元で処理できるようにする
    throw error;
  }
}

// ==============================================================================
// 2. 型定義 (TypeScript Interface)
// ==============================================================================

// メーカー一覧API (/makers/) 用の型
export interface Maker {
  name: string;
  slug: string;
  product_count: number;
}

// サブカテゴリ集計用の型 (メーカー別商品一覧APIに含まれる)
export interface SubCategory {
  id: number;
  name: string;      // 整形された表示名 (例: "ノートパソコン")
  full_name: string; // フィルタリングに使う完全名 (例: "家電~~パソコン~~ノートパソコン")
  count: number;
}

// 商品データ自体の型
export interface Product {
  id: number;
  product_name: string;
  price: string; // DjangoのDecimalFieldはJavaScriptでは文字列として扱われる
  image_url: string | null;
  final_category_id: number;
  maker_slug: string;
}

// 商品一覧API (/products/) の完全なレスポンス型
export interface ProductListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
  // メーカーフィルタが適用された場合にのみ含まれるフィールド
  sub_categories?: SubCategory[]; 
}