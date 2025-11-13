// app/makers/page.tsx

import Link from 'next/link';
// ★★★ パスはプロジェクト構造に合わせて調整してください ★★★
import { fetchApiData, Maker } from '../../lib/apiClient'; 

// 環境変数からサイト名を取得
// .envが正しく設定されていれば、サイト名が表示されます
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "サイト名未設定";

/**
 * メーカー一覧APIからデータを取得するサーバー関数
 */
async function getMakers(): Promise<Maker[]> {
  try {
    // APIクライアントを使用してメーカー一覧を取得 (/makers/ は /api/v1/makers/ に展開される)
    const makers = await fetchApiData<Maker[]>('/makers/');
    return makers;
  } catch (error) {
    console.error('メーカーデータの取得中にエラーが発生しました:', error);
    // データ取得失敗時は空の配列を返し、ページ表示を継続
    return [];
  }
}

export default async function MakersListPage() {
  const makers = await getMakers();

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center border-b pb-2">
        🛍️ {SITE_NAME} | メーカー一覧
      </h1>
      
      {makers.length === 0 ? (
        <div className="p-10 text-center bg-yellow-50 border border-yellow-300 rounded-lg">
          <p className="text-lg text-gray-700">🚨 メーカーデータが見つかりませんでした。API接続を確認してください。</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {makers.map((maker) => (
            <li 
              key={maker.slug} 
              className="p-4 bg-white border rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              {/* クリックでメーカー別商品一覧ページへ遷移 */}
              <Link 
                href={`/products?maker=${maker.slug}`} 
                className="flex justify-between items-center"
              >
                <span className="text-xl font-semibold text-blue-700 hover:text-blue-500 transition-colors">
                  {maker.name}
                </span>
                <span className="text-lg text-gray-600 font-mono bg-gray-100 px-3 py-1 rounded-full">
                  商品数: **{maker.product_count.toLocaleString()}** 件
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      
    </div>
  );
}