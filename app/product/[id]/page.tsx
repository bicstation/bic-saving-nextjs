// /app/product/[id]/page.tsx (商品個別ページ - SEO対策 最終完全版)

// App Router の Server Component として強制的に動的レンダリングを有効化
export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation"; // 404表示のためにインポート
import type { Metadata } from "next"; // メタデータ生成のためにインポート

// ★追加インポート
import ProductCard from "@/app/components/ProductCard"; // 関連商品表示に使用

// 共通の型をインポート
import { Product } from "@/types/index"; 

// ★修正: data.ts から必要な関数をインポート
import { 
    getProductById,
    getCategoryName,
    getProductsByCategory,
} from "@/lib/data"; 

// ★★★ 環境変数から本番URLを取得 ★★★
const BASE_URL = process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://bic-saving.com'; 
// ★★★ ---------------------------------- ★★★


// --- 1. Propsの型定義 ---
interface ProductDetailPageProps {
    params: {
        id: string; // URLから取得した商品IDは常に文字列
    };
    searchParams?: { [key: string]: string | string[] | undefined };
}

// --- 2. メタデータの生成 (SEO対策) ---
export async function generateMetadata({ params: awaitedParams }: ProductDetailPageProps): Promise<Metadata> {
    
    // エラー解消のための対応: paramsをawaitしてから使用
    const params = await awaitedParams; 
    
    const productId = params.id;
    const product: Product | null = await getProductById(productId);

    if (!product) {
        return {
            title: '商品が見つかりません',
            description: '指定された商品の情報を見つけることができませんでした。',
        };
    }
    
    // SEO用ディスクリプションの生成
    const descriptionText = product.description 
        ? `${product.description.substring(0, 100)}...【価格: ¥${product.price.toLocaleString()}】`
        : `${product.name} の詳細ページです。お得な価格で提供中。`;
    
    // Canonical URLを決定
    const canonicalUrl = `${BASE_URL}/product/${product.id}`; 

    return {
        title: product.name, // layout.tsx の template に自動挿入される
        description: descriptionText,
        
        // ★★★ Canonical URLの設定 ★★★
        alternates: {
            canonical: canonicalUrl,
        },
        
        // OGP/Twitterも動的に設定
        openGraph: {
            title: product.name,
            description: descriptionText,
            url: canonicalUrl,
            images: [product.image || '/og-image.png'],
        },
        twitter: {
            title: product.name,
            description: descriptionText,
            images: [product.image || '/og-image.png'],
        }
    };
}


// --- 3. ページコンポーネント本体 ---
export default async function ProductDetailPage({ params: awaitedParams }: ProductDetailPageProps) {
    
    // エラー解消のための対応: paramsをawaitしてから使用
    const params = await awaitedParams; 
    
    const productId = params.id; 

    // ★修正: data.ts の getProductById を使用してデータ取得
    const product: Product | null = await getProductById(productId);

    // 3. 商品が存在しない場合の処理 
    if (!product) {
        notFound();
    }
    
    // --- カテゴリ名と関連商品の取得ロジック ---
    let categoryName: string | null = null;
    let relatedProducts: Product[] = [];
    
    if (product.category) {
        // ★★★ 修正1: product.categoryをnumber型に統一し、categoryIdとして使用 ★★★
        const categoryId = typeof product.category === 'string'
            ? parseInt(product.category, 10)
            : product.category;

        // categoryIdが有効な数値であることを確認
        if (!categoryId || isNaN(categoryId)) {
            // 無効な場合は処理を中断しない
        } else {
            // カテゴリ名と関連商品のデータを並列で取得
            const [name, relatedData] = await Promise.all([
                // ★★★ 修正2: 不適切な getProductById の代わりに getCategoryName を使用 ★★★
                getCategoryName(categoryId),
                // 同じカテゴリから4件の商品を取得
                getProductsByCategory({ categoryId: categoryId, limit: 4 }),
            ]);

            categoryName = name; // Promise.all で取得したカテゴリ名をセット

            // 関連商品リストから自分自身を除外
            relatedProducts = relatedData.products.filter(p => p.id !== product.id);
        }
    }
    // ---------------------------------------------


    // 価格をカンマ区切りにフォーマット
    const formattedPrice = product.price.toLocaleString();
    
    // ★★★ 修正: Product型にproduct_urlがない場合のエラー回避 ★★★
    // (product as any) を使用して、型定義にないプロパティへのアクセスを許可します
    // image_c63457.png / image_c637e0.png のエラーに対応
    const affiliateLinkUrl = product.product_url || "https://example.com/default-affiliate-link";

    // ★★★ JSON-LD 構造化データ（Productスキーマ）の生成 ★★★
    const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "sku": product.id.toString(),
        "image": product.image,
        "description": product.description 
            ? product.description.substring(0, 150) + '...'
            : product.name + "の詳細情報。",
        // Offers (価格と在庫情報)
        "offers": {
            "@type": "Offer",
            "url": affiliateLinkUrl, // アフィリエイトリンク/購入リンクを設定
            "priceCurrency": "JPY",
            "price": product.price.toString(),
            "itemCondition": "https://schema.org/NewCondition",
            "availability": "https://schema.org/InStock" // 在庫状況に応じて変更
        }
    };


    // 4. メインコンテンツの表示
    return (
        <>
            {/* ★★★ JSON-LD 構造化データの挿入 ★★★ */}
            {/* Server Componentでは、scriptタグを直接レンダリング可能 */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
            />
        
            <div className="product-detail-container" style={{ padding: '20px' }}>
                <section className="product-main-info">
                    {/* パンくずリスト */}
                    <nav className="breadcrumb">
                        <Link href="/">ホーム</Link>
                        {/* ★カテゴリパンくずを追加 */}
                        {categoryName && (
                            <>
                                <span> &gt; </span>
                                {/* カテゴリページへのリンク */}
                                <Link href={`/category/${product.category}`} style={{ color: '#0070f3' }}>
                                    {categoryName}
                                </Link>
                            </>
                        )}
                        <span> &gt; </span>
                        {/* 最終アイテム（現在の商品名） */}
                        <span className="current" style={{ fontWeight: 'bold' }}>{product.name}</span>
                    </nav>

                    {/* --- 商品メイン情報エリア --- */}
                    <div className="product-detail-content" style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
                        
                        {/* 画像エリア */}
                        <div className="product-image-area">
                            <img 
                                src={product.image || '/placeholder.png'} 
                                alt={product.name} 
                                style={{ width: '300px', height: 'auto', border: '1px solid #ccc' }} 
                            />
                        </div>
                        
                        {/* 情報エリア */}
                        <div className="product-info-area">
                            {/* ★カテゴリ表示 */}
                            {categoryName && (
                                <p style={{ color: '#0070f3', fontSize: '14px', marginBottom: '5px' }}>
                                    カテゴリ: <strong>{categoryName}</strong>
                                </p>
                            )}

                            <h1 style={{ marginTop: '0px', marginBottom: '10px' }}>{product.name}</h1>
                            
                            <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'red' }}>
                                価格: ¥{formattedPrice}
                            </p>
                            <p style={{ marginTop: '10px' }}><strong>商品ID:</strong> {product.id}</p>
                            
                            <p style={{ marginTop: '20px', lineHeight: '1.6' }}>
                                <strong>商品説明:</strong> {product.description || `現在、${product.name} の詳細な説明は提供されていません。`}
                            </p>
                            
                            {/* ★★★ アフィリエイトリンクボタン ★★★ */}
                            <a
                                href={affiliateLinkUrl} // 実際の商品のリンクをセット
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-block', // aタグがbuttonのように振る舞うように設定
                                    marginTop: '30px',
                                    padding: '10px 20px',
                                    fontSize: '18px',
                                    backgroundColor: '#0070f3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    textDecoration: 'none', // リンクの下線を削除
                                    cursor: 'pointer' // ボタンのようにカーソルを変更
                                }}
                            >
                                公式サイトで詳細を見る・購入する
                            </a>
                            {/* ★★★ ---------------------------------------------------- ★★★ */}
                        </div>
                    </div>
                </section>

                {/* --- 関連商品セクション --- */}
                {relatedProducts.length > 0 && (
                    <section className="related-products" style={{ marginTop: '60px' }}>
                        <h2 style={{ borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
                            {categoryName || '他の'} の関連商品
                        </h2>
                        {/* ★修正: gridTemplateColumnsを変更して最大6列表示にする */}
                        <div className="product-grid" style={{ 
                            display: 'grid', 
                            // 最小幅を150px、最大幅を1fr（均等）、最大6列表示
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                            gap: '20px', 
                            marginTop: '20px'
                        }}>
                            {relatedProducts.map((p) => (
                                // ProductCard コンポーネントを使用
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}