// /var/www/bic-saving.com/lib/products.js

// 環境変数からベースURLを取得 (https://api.bic-saving.com/api/v1)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * 商品データをAPIから取得する（現在、ダミーとして設定）
 * @returns {Promise<Array<Object>>} 商品の配列
 */
export async function getProducts() {
  console.log(`Fetching products from: ${API_BASE_URL}/products/`);
  
  try {
    // 以前確認した商品APIのエンドポイント
    const res = await fetch(`${API_BASE_URL}/products/?page_size=1200000`, {
      next: { revalidate: 60 } // 1分ごとに再取得
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.status}`);
    }

    const data = await res.json();
    
    // results 配列を返す
    return data.results || [];
    
  } catch (error) {
    console.error("Error fetching products:", error);
    // エラー時は空の配列を返す
    return []; 
  }
}