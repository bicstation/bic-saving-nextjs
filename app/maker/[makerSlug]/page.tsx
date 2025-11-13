// /app/maker/[makerSlug]/page.tsx (メーカー機能・ページング統合版)

import React, { Suspense } from 'react'; // Suspenseを追加
import Link from 'next/link';
import type { Metadata } from 'next'; // Metadataをインポート

// ★修正3: データ取得関数を全て /lib/data からインポート (統合後のファイル名) ★
import { 
    getProductsByMaker, 
    getMakerNameBySlug, 
    getAllMakers,
    getCategories, // ★追加: サイドバー表示用
} from '@/lib/data'; 

// ★修正3: コンポーネント、型定義をインポート
import { Maker, MakerPageProps } from '@/types/index';
import ProductGrid from '@/app/components/ProductGrid'; 
import ProductSidebar from '@/app/components/ProductSidebar'; // ★追加: サイドバー
import Pagination from '@/app/components/Pagination'; // ★追加: ページネーション

// ====================================================================
// メタデータ生成
// ====================================================================

export async function generateMetadata({ params }: MakerPageProps): Promise<Metadata> {
    const makerName = await getMakerNameBySlug(params.makerSlug) || 'メーカー不明';
    
    return {
        title: `${makerName}の商品一覧 | bic-saving.com`,
        description: `${makerName}の最新セール商品、お得な情報をご紹介します。`,
    };
}

// ====================================================================
// 静的生成パラメータ
// ====================================================================

export async function generateStaticParams() {
    const makers: Maker[] = await getAllMakers(); 
    
    return makers.map((maker: Maker) => ({ 
        makerSlug: maker.slug
    }));
}


// ====================================================================
// ページコンポーネント本体
// ====================================================================

// ★修正2: searchParams を受け取るように型を拡張 (MakerPagePropsは/types/indexで定義されていると仮定)
export default async function MakerPage({ params, searchParams }: MakerPageProps) {
    const { makerSlug } = params;

    // --- ページング処理 (★修正2: ページングロジックの追加★) ---
    const searchParamsObj = (await searchParams) || {};
    const { page } = searchParamsObj;
    const pageParam = (Array.isArray(page) ? page[0] : page) || '1'; 
    const currentPage = parseInt(pageParam, 10);
    const pageSize = 12; 

    // 1. データ取得 (Promise.allでサイドバー用データも同時に取得)
    const [productData, makers, categories] = await Promise.all([ 
        getProductsByMaker({ 
            makerSlug, 
            page: currentPage, 
            limit: pageSize // ★ページングパラメータを渡す
        }),
        getAllMakers(),     // ★追加: サイドバーのメーカーリスト用
        getCategories(),    // ★追加: サイドバーのカテゴリリスト用
    ]);

    const { products, totalPages } = productData;

    // 2. メーカー名を取得
    const makerName = await getMakerNameBySlug(makerSlug); // await が必要

    // メーカー名が存在しない場合 (404 または Not Found 処理)
    if (!makerName) {
        return (
            <div className="container" style={{ margin: '40px auto', padding: '0 20px' }}>
                <h1>メーカー '{makerSlug}' が見つかりませんでした。</h1>
                <p>URLを確認するか、トップページからお探しください。</p>
                <Link href="/">トップページに戻る</Link>
            </div>
        );
    }

    // 商品一覧の表示
    return (
        <main className="page-layout" style={{ display: 'flex', gap: '20px', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* 2. Sidebar (★修正1: サイドバーコンポーネントの追加★) */}
            <aside style={{ flex: '0 0 250px' }}>
                <ProductSidebar 
                    categories={categories} 
                    makers={makers} 
                    currentMakerSlug={makerSlug} // 現在のメーカーをハイライト
                />
            </aside>
            
            {/* 3. Main Content (商品リストとページネーション) */}
            <section className="main-content" style={{ flex: '1' }}>
                <h1 style={{ fontSize: '2rem', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
                    {makerName} の商品一覧
                </h1>
                
                <p style={{ color: '#555' }}>
                    全 **{products.length}** 件の商品が見つかりました。（全 {totalPages} ページ中 {currentPage} ページ目）
                </p>

                {/* ProductGrid コンポーネントを呼び出す */}
                {products.length > 0 ? (
                    <ProductGrid products={products} />
                ) : (
                    <div style={{ border: '1px dashed #ccc', padding: '30px', textAlign: 'center', marginTop: '30px' }}>
                        <p>現在、**{makerName}** のセール商品はありません。</p>
                        <Link href="/">トップページに戻る</Link>
                    </div>
                )}
                
                {/* ページネーション (★修正2: ページネーションコンポーネントの追加★) */}
                <Suspense fallback={<div>ページネーション読み込み中...</div>}>
                    <Pagination totalPages={totalPages} />
                </Suspense>
            </section>
        </main>
    );
}