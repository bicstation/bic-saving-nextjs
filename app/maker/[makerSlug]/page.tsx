// /app/maker/[makerSlug]/page.tsx (最終修正版 - 最小4列表示に強制)

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';

// データ取得ロジック
import { 
    getProductsByMaker, 
    getMakerNameBySlug, 
    getAllMakers,
    getCategories,
    getMakerSlugMap,
} from "@/lib/data"; 

// コンポーネント
import ProductCard from '@/app/components/ProductCard';
import Pagination from '@/app/components/Pagination';


// --- 1. ダイナミックルーティングの静的生成 (SSG) ---

/**
 * 事前ビルドするメーカーのページパスを生成
 */
export async function generateStaticParams() {
    const makers = await getAllMakers();
    
    // APIが提供するslug (例: oshare-walker-official-store) をそのまま使用
    return makers.map(maker => ({
        makerSlug: maker.slug, 
    }));
}


// --- 2. メタデータ生成 (SEO対策) ---

interface MakerPageProps {
    params: { makerSlug: string };
    searchParams: { page?: string };
}

/**
 * ページの動的なMetadataを生成
 */
export async function generateMetadata({ params: awaitedParams }: MakerPageProps): Promise<Metadata> {
    
    // paramsをawaitしてから使用 (非同期APIの利用)
    const params = await awaitedParams;
    
    // URLエンコードされたスラッグをデコード (例: "公式オシャレウォーカー-43" または "oshare-walker-official-store")
    const decodedUrlSlug = decodeURIComponent(params.makerSlug);
    
    // ★APIに渡すスラッグを特定するためにマッピングロジックを使用★
    
    // 1. URLから切り出す日本語名 (例: "公式オシャレウォーカー")
    const lastHyphenIndex = decodedUrlSlug.lastIndexOf('-');
    let makerNameFromUrl = decodedUrlSlug; 
    if (lastHyphenIndex !== -1) {
        makerNameFromUrl = decodedUrlSlug.substring(0, lastHyphenIndex);
    }
    
    const makerMap = await getMakerSlugMap(); 
    const apiMakerSlug = makerMap.get(makerNameFromUrl) || decodedUrlSlug; // マップになければそのまま使用 (generateStaticParamsでAPIスラッグが来た場合を想定)
    
    // API用スラッグでメーカー名を取得
    const makerName = await getMakerNameBySlug(apiMakerSlug); 
    
    if (!makerName) {
        return {
            title: 'メーカーが見つかりません',
            description: '指定されたメーカーの商品は存在しません。',
        };
    }

    const title = `${makerName}の商品一覧`;
    const description = `${makerName}の最新商品、人気商品を多数取り揃えています。価格比較や詳細情報はこちらから。`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
        },
    };
}


// --- 3. メインコンポーネント (Server Component) ---

export default async function MakerPage({ params: awaitedParams, searchParams: awaitedSearchParams }: MakerPageProps) {
    
    // Propsをawaitしてから使用 (非同期APIの利用)
    const [params, searchParams] = await Promise.all([awaitedParams, awaitedSearchParams]);
    
    // ページネーションとスラッグの処理
    const currentPage: number = Number(searchParams.page) || 1; 

    const limit = 12; // 1ページあたりの商品数
    
    // URLエンコードされたスラッグをデコード (例: "公式オシャレウォーカー-43")
    const decodedUrlSlug = decodeURIComponent(params.makerSlug);

    // 1. URLスラッグのデコードとIDの切り離し (例: "公式オシャレウォーカー-43" -> "公式オシャレウォーカー")
    const lastHyphenIndex = decodedUrlSlug.lastIndexOf('-');
    
    let makerNameFromUrl = decodedUrlSlug; // デフォルトはデコードしたスラッグ
    if (lastHyphenIndex !== -1) {
        // 末尾のIDを切り離した、日本語のメーカー名を取得
        makerNameFromUrl = decodedUrlSlug.substring(0, lastHyphenIndex);
    }
    
    // 2. マッピングテーブルの取得とAPI用スラッグへの変換
    const [
        makerMap, 
        makers,
        categories 
    ] = await Promise.all([
        getMakerSlugMap(), 
        getAllMakers(),
        getCategories(), 
    ]);

    // ★APIに渡すべき正しいメーカーのスラッグをここで決定★
    const apiMakerSlug = makerMap.get(makerNameFromUrl) || decodedUrlSlug;


    // ★★★ デバッグログ (最終確認用) ★★★
    console.log(`[DEBUG] URLから切り出した日本語名: ${makerNameFromUrl}`);
    console.log(`[DEBUG] APIに渡す最終スラッグ: ${apiMakerSlug}`);
    // ★★★ デバッグログ ★★★


    // 3. 必要なデータを並行して取得 (変換後の apiMakerSlug を使用)
    const [
        productData, 
        makerName, 
    ] = await Promise.all([
        getProductsByMaker({ makerSlug: apiMakerSlug, page: currentPage, limit }),
        getMakerNameBySlug(apiMakerSlug), 
    ]);


    // メーカー名が取得できなかったら404
    if (!makerName) {
        notFound();
    }

    const { products, totalPages } = productData;

    return (
        <div className="w-full">
            
            {/* ★★★ サイドバーを削除済み ★★★ */}
            {/* <aside className="hidden lg:block w-64 flex-shrink-0">
                <CategorySidebar 
                    categories={categories}
                    makers={makers}
                    currentMakerSlug={apiMakerSlug} // 変換後のスラッグを使用
                />
            </aside> */}

            {/* --- メインコンテンツ --- */}
            <div className="w-full">
                <h1 className="text-3xl font-extrabold text-gray-800 mb-6 border-b-4 border-indigo-500 pb-2">
                    <span className="text-indigo-600">🏭</span> {makerName} の商品一覧
                </h1>
                
                {/* パンくずリスト (シンプルに) */}
                <nav className="text-sm mb-4">
                    <Link href="/" className="text-gray-600 hover:text-indigo-600">トップ</Link>
                    <span className="mx-2 text-gray-400">/</span>
                    <span className="font-semibold text-gray-800">{makerName}</span>
                </nav>

                {products.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow-md">
                        <p className="text-xl text-gray-600">
                            現在、**{makerName}** の商品は見つかりませんでした。
                        </p>
                        <p className="mt-4 text-sm text-gray-500">
                            恐れ入りますが、別のカテゴリやメーカーをお探しください。
                        </p>
                    </div>
                ) : (
                    <>
                        {/* 商品グリッド */}
                        {/* ★★★ 修正: 最小列数を grid-cols-4 に変更 ★★★ */}
                        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {/* ページネーション */}
                        <Pagination 
                            totalPages={totalPages} 
                            currentPage={currentPage}
                            basePath={`/maker/${params.makerSlug}`} 
                        />
                    </>
                )}
            </div>
        </div>
    );
}