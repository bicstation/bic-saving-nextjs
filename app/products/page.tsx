// app/products/page.tsx

import Link from 'next/link';
import { notFound } from 'next/navigation';
// lib/apiClient.ts から必要な型と関数をインポート
import { 
  fetchApiData, 
  ProductListResponse, 
  Product, 
  SubCategory 
} from '../../lib/apiClient'; 

// 環境変数からサイト名を取得
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "サイト名未設定";

// 商品一覧APIからデータを取得する関数
async function getProducts(
  makerSlug: string, 
  categoryFullName?: string
): Promise<ProductListResponse> {
  let endpoint = `/products/?maker=${makerSlug}`;
  
  if (categoryFullName) {
    // カテゴリフィルタがある場合はクエリパラメータを追加し、URLエンコードする
    endpoint += `&final_category_name=${encodeURIComponent(categoryFullName)}`;
  }

  try {
    const data = await fetchApiData<ProductListResponse>(endpoint);
    return data;
  } catch (error) {
    console.error('商品データ取得中にエラーが発生しました:', error);
    // エラー時はデフォルト値を返す
    return { count: 0, next: null, previous: null, results: [] };
  }
}


export default async function ProductsListPage({
  searchParams, // Next.jsが提供するクエリパラメータ
}: {
  searchParams: { maker?: string; category?: string };
}) {
  const makerSlug = searchParams.maker;
  const categoryFullName = searchParams.category;

  if (!makerSlug) {
    // makerクエリパラメータがない場合はNot Foundを表示
    notFound();
  }

  const data = await getProducts(makerSlug, categoryFullName);
  
  // メーカー名をスラッグから推測（表示のため、-をスペースに置換し大文字化）
  const makerName = makerSlug.replace(/-/g, ' ').toUpperCase(); 

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-4 text-center">
        🔎 {makerName} の商品一覧
      </h1>
      <p className="mb-6 text-gray-600 text-center">
        {SITE_NAME} にて、全 {data.count.toLocaleString()} 件中、1ページ目を表示しています。
      </p>

      <div className="flex space-x-6">
        {/* --- 左側のカテゴリナビゲーション --- */}
        <div className="w-1/4 flex-shrink-0">
          <h2 className="text-xl font-semibold mb-3 border-b pb-1">カテゴリで絞り込む</h2>
          
          {/* 全ての商品を表示するリンク */}
          <Link 
            href={`/products?maker=${makerSlug}`}
            className={`block p-2 rounded-md transition-colors text-base ${!categoryFullName ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-gray-100'}`}
          >
            全ての商品
          </Link>
          
          <ul className="mt-3 space-y-1">
            {/* カテゴリ集計データが存在する場合のみ表示 */}
            {data.sub_categories && data.sub_categories.map((cat: SubCategory) => (
              <li key={cat.id}>
                <Link
                  // カテゴリフィルタをURLに追加
                  href={`/products?maker=${makerSlug}&category=${cat.full_name}`}
                  className={`block p-2 rounded-md transition-colors text-gray-800 text-base ${categoryFullName === cat.full_name ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-gray-100'}`}
                >
                  {cat.name} ({cat.count.toLocaleString()})
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* --- 右側の商品リスト --- */}
        <div className="w-3/4 grid grid-cols-2 lg:grid-cols-3 gap-6">
          {data.results.map((product: Product) => (
            <div 
              key={product.id} 
              className="border p-4 rounded-lg shadow-sm hover:shadow-lg transition-shadow bg-white"
            >
              {product.image_url && (
                <img 
                  src={product.image_url} 
                  alt={product.product_name} 
                  className="w-full h-32 object-contain mb-3 rounded-md" 
                />
              )}
              <h3 className="text-md font-medium h-10 overflow-hidden mb-1" title={product.product_name}>
                {product.product_name}
              </h3>
              <p className="text-lg font-bold text-red-600">
                ¥{Number(product.price).toLocaleString()}
              </p>
              {/* TODO: 商品詳細へのリンクを追加 */}
            </div>
          ))}
        </div>
      </div>
      
      {/* TODO: ページネーションリンクの追加 (data.next, data.previous) */}
      
    </div>
  );
}