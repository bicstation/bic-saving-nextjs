// /app/maker/[makerSlug]/page.tsx

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';

// データ取得ロジック
import { 
    getProductsByMaker, 
    getMakerNameBySlug, 
    getAllMakers,
    getCategories, // サイドバーに渡すため
} from "@/lib/data"; 

// コンポーネント
import ProductCard from '@/app/components/ProductCard';
import Pagination from '@/app/components/Pagination';
import CategorySidebar from '@/app/components/CategorySidebar'; // 統合されたサイドバー


// --- 1. ダイナミックルーティングの静的生成 (SSG) ---

/**
 * 事前ビルドするメーカーのページパスを生成
 */
export async function generateStaticParams() {
    const makers = await getAllMakers();
    // デバッグのため、ログは削除しましたが、必要に応じてconsole.log(makers)を入れて確認してください。
    
    // スラッグをエンコードせずにそのまま返す (Next.jsが処理)
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
export async function generateMetadata({ params }: MakerPageProps): Promise<Metadata> {
    
    // URLエンコードされたスラッグをデコード
    const decodedSlug = decodeURIComponent(params.makerSlug);
    
    // デバッグログが /lib/data.ts に含まれていることを確認
    const makerName = await getMakerNameBySlug(decodedSlug); 
    
    if (!makerName) {
        // メーカー名が見つからない場合はNotFoundを返すか、一般的なメタデータを返す
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

export default async function MakerPage({ params, searchParams }: MakerPageProps) {
    
    // ページネーションとスラッグの処理
    const currentPage = Number(searchParams.page) || 1;
    const limit = 12; // 1ページあたりの商品数
    
    // URLエンコードされたスラッグをデコード
    const makerSlug = decodeURIComponent(params.makerSlug);

    // 必要なデータを並行して取得
    const [
        productData, 
        makerName, 
        makers, 
        categories
    ] = await Promise.all([
        getProductsByMaker({ makerSlug, page: currentPage, limit }),
        getMakerNameBySlug(makerSlug), // ★デバッグログが含まれている関数★
        getAllMakers(),
        getCategories(),
    ]);

    // メーカー名が取得できなかったら404
    if (!makerName) {
        notFound();
    }

    const { products, totalPages } = productData;

    return (
        <div className="flex gap-6">
            
            {/* --- サイドバー --- */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
                <CategorySidebar 
                    categories={categories}
                    makers={makers}
                    currentMakerSlug={makerSlug} // 現在のメーカーをハイライト
                />
            </aside>

            {/* --- メインコンテンツ --- */}
            <div className="flex-grow min-w-0">
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {/* ページネーション */}
                        <Pagination 
                            totalPages={totalPages} 
                            currentPage={currentPage}
                            basePath={`/maker/${params.makerSlug}`} // URLエンコードされたスラッグをそのまま使用
                        />
                    </>
                )}
            </div>
        </div>
    );
}