// lib/categories.js

// 環境変数からベースURLを取得 (https://api.bic-saving.com/api/v1)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * カテゴリデータをAPIから取得する
 * @returns {Promise<Array<Object>>} カテゴリの階層構造を持つ配列
 */
export async function getCategories() {
  console.log(`Fetching categories from: ${API_BASE_URL}/categories/`);
  
  try {
    const res = await fetch(`${API_BASE_URL}/categories/`, {
      // ISR (Incremental Static Regeneration) の設定
      next: { revalidate: 3600 } // 1時間ごとに再取得
    });

    if (!res.ok) {
      // ネットワークエラー以外（4xx, 5xx）の場合
      throw new Error(`Failed to fetch categories: ${res.status}`);
    }

    const data = await res.json();
    
    // データは配列で返されるため、そのまま返す
    return data;
    
  } catch (error) {
    console.error("Error fetching categories:", error);
    // 開発/デバッグ用に空の配列を返すか、エラーをスロー
    return []; 
  }
}