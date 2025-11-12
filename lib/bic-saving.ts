// /lib/bic-saving.ts (ECサイトカテゴリ取得のためのモジュール)

/**
 * ECサイトのカテゴリ構造を定義するインターフェース
 */
export interface Category {
    id: number;
    name: string;
    product_count: number; // APIレスポンスから確認できたため追加
    children: Category[]; // APIレスポンスから確認できたため追加
}

/**
 * APIから返されるトップレベルのレスポンス構造
 */
interface CategoryApiResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Category[]; // 実際のカテゴリ配列
}

/**
 * ECサイトのトップカテゴリ一覧を取得する非同期関数
 * @returns トップレベルカテゴリの配列
 */
export async function getTopCategories(): Promise<Category[]> {
    // 修正された正しいURLを使用
    const EC_API_URL = "https://api.bic-saving.com/api/v1/categories/"; 

    // Next.jsのServer Componentとしてキャッシュを利用
    const res = await fetch(EC_API_URL, {
        cache: 'force-cache' 
    });
    
    // API呼び出しが成功したかチェック
    if (!res.ok) {
        // のエラーの原因となる行。APIエラー発生時に実行される
        throw new Error(`Failed to fetch EC categories: ${res.statusText}`); 
    }

    // JSONをパース
    const data: CategoryApiResponse = await res.json();
    
    // ★★★ 修正: カテゴリデータが含まれる 'results' 配列を抽出して返す ★★★
    return data.results;
}