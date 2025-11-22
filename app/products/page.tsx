// app/products/page.tsx

import Link from 'next/link';
import { notFound } from 'next/navigation';
import Pagination from '@/app/components/Pagination'; 

// lib/apiClient.ts から必要な型と関数をインポート
import { 
    fetchApiData, 
    ProductListResponse, 
    Product, 
    SubCategory 
} from '../../lib/apiClient'; 

// 環境変数からサイト名を取得
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "サイト名未設定";
// APIのベースURLを定義
const BASE_API_URL = 'https://api.bic-saving.com/api/v1'; 

// 1ページあたりの商品数 
const PAGE_SIZE = 20; 

// 商品一覧APIからデータを取得する関数
async function getProducts(
    makerSlug: string, 
    categoryFullName?: string,
    page: number = 1 
): Promise<ProductListResponse> {
    
    let endpoint = `/products/?maker=${makerSlug}&page=${page}`; 
    
    if (categoryFullName) {
        endpoint += `&final_category_name=${encodeURIComponent(categoryFullName)}`;
    }

    const requestUrl = `${BASE_API_URL}${endpoint}`;
    console.log(`[DEBUG] API Request URL: ${requestUrl}`);

    try {
        const data = await fetchApiData<ProductListResponse>(endpoint);
        return data;
    } catch (error) {
        console.error('商品データ取得中にエラーが発生しました:', error);
        return { count: 0, next: null, previous: null, results: [] };
    }
}

// 修正箇所: searchParamsをawaitするロジックをコンポーネント内に追加

export default async function ProductsListPage({
    searchParams, 
}: {
    // searchParams の型定義はそのままでOK
    searchParams: { maker?: string; category?: string; page?: string }; 
}) {
    // ★★★ 修正箇所: searchParams の値を参照する前に await を使用 ★★★
    // Next.js 15.5.6 のエラーメッセージに対応
    const resolvedSearchParams = (await searchParams) || {};

    const makerSlug = resolvedSearchParams.maker;
    const categoryFullName = resolvedSearchParams.category;
    
    // ページ番号の取得と整形
    const currentPage = parseInt(resolvedSearchParams.page || '1', 10);

    // makerSlug がない場合は 404
    if (!makerSlug) {
        notFound();
    }

    // API呼び出し
    const data = await getProducts(makerSlug, categoryFullName, currentPage);
    
    // メーカー名を整形 (例: hp-directplus -> HP DIRECTPLUS)
    const makerName = makerSlug.replace(/-/g, ' ').toUpperCase(); 
    
    // 総ページ数の計算
    const totalPages = Math.ceil(data.count / PAGE_SIZE);

    // ページネーション用のベースパス作成
    // ページ番号以外の全てのクエリパラメータを保持
    const currentSearchParams = new URLSearchParams(resolvedSearchParams as Record<string, string>);
    currentSearchParams.delete('page'); 
    
    // クエリパラメータを保持したベースパスを作成 (例: /products?maker=hp&category=notebook)
    const basePathWithParams = `/products?${currentSearchParams.toString()}`;

    return (
        <div className="container mx-auto p-4 max-w-6xl">
             <h1 className="text-3xl font-bold mb-4 text-center">
                🔎 {makerName} の商品一覧
            </h1>
            <p className="mb-6 text-gray-600 text-center">
                {SITE_NAME} にて、全 {data.count.toLocaleString()} 件中、{currentPage}ページ目を表示しています。
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
                        {data.sub_categories && Array.isArray(data.sub_categories) && data.sub_categories.map((cat: SubCategory) => (
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
                <div className="w-3/4">
                    {data.results.length === 0 ? (
                        <p className="text-gray-500">この絞り込み条件に一致する商品はありません。</p>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                            {data.results.map((product: Product) => (
                                <Link 
                                    key={product.id}
                                    href={`/product/${product.id}`} 
                                    className="border p-4 rounded-lg shadow-sm hover:shadow-lg transition-shadow bg-white block"
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
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {/* ページネーションリンクの追加 */}
            {totalPages > 1 && (
                <div className="mt-12 flex justify-center">
                    <Pagination
                        totalPages={totalPages}
                        currentPage={currentPage}
                        basePath={basePathWithParams} 
                    />
                </div>
            )}
            
        </div>
    );
}