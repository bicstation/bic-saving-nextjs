// /app/products/[id]/page.tsx (商品個別ページ - TypeScript版)

// App Router の Server Component として強制的に動的レンダリングを有効化
export const dynamic = "force-dynamic";

import Link from "next/link";
// 共通の型をインポート
import { Product } from "@/types/index"; 

// --- 1. Propsの型定義 ---
interface ProductDetailPageProps {
    params: {
        id: string; // URLから取得した商品IDは常に文字列
    };
    // searchParams は個別ページでは通常使いませんが、一応定義
    searchParams?: { [key: string]: string | string[] | undefined };
}

// --- 2. ページコンポーネント本体 ---
export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
    
    const productId = params.id; 

    // ★★★ IDが空またはnullの場合のチェック ★★★
    if (!productId || productId.length === 0) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h1 style={{ color: 'red' }}>ルーティング設定エラー</h1>
                <p>URLから商品IDが取得できませんでした。</p>
                {/* ★修正: アクセスURLの指示を /products/123 形式に戻します ★ */}
                <p>アクセスURLは **http://localhost:3000/products/123** の形式になっているか確認してください。</p>
            </div>
        );
    }
    // ★★★ IDチェック終わり ★★★


    // データを取得するAPIエンドポイント 
    const API_URL = `https://api.bic-saving.com/api/v1/products/${productId}/`;
    
    let product: Product | null = null; // 取得する商品の型を指定
    
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            // APIサーバーから404や500が返された場合
            throw new Error(`API Status: ${response.status} ${response.statusText}`);
        }
        
        // 取得したJSONデータを Product 型として扱う
        product = (await response.json()) as Product;
        
    } catch (error) {
        // ネットワークエラーなどが発生した場合
        console.error("Product fetch error:", error);
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h1 style={{ color: 'red' }}>商品データ取得エラー</h1>
                <p>商品ID: **{productId}** のデータ取得中にエラーが発生しました。</p>
                <p>エラー詳細: {(error as Error).message}</p>
                <p>アクセス先API: {API_URL}</p>
            </div>
        );
    }
    
    // 3. 商品が存在しない場合の処理 
    if (!product || !product.id) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h1 style={{ color: 'orange' }}>商品が見つかりません</h1>
                <p>指定された商品ID ({productId}) のデータはAPIから取得できませんでした。</p>
                <p>API URL: {API_URL}</p>
            </div>
        );
    }

    // 4. メインコンテンツの表示
    return (
        <div className="product-detail-container" style={{ padding: '20px' }}>
            {/* パンくずリスト */}
            <nav className="breadcrumb">
                <Link href="/">ホーム</Link> &gt; 
                <span>{product.product_name}</span>
            </nav>
            
            <h1 style={{ marginTop: '20px' }}>{product.product_name}</h1>
            
            <div className="product-detail-content" style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
                
                {/* 画像エリア (image_urlは /types/index.ts で定義済み) */}
                <div className="product-image-area">
                    <img src={product.image_url} alt={product.product_name} style={{ width: '300px', height: 'auto', border: '1px solid #ccc' }} />
                </div>
                
                {/* 情報エリア */}
                <div className="product-info-area">
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'red' }}>
                        価格: ¥{parseFloat(product.price).toLocaleString()}
                    </p>
                    <p style={{ marginTop: '10px' }}><strong>商品ID:</strong> {product.id}</p>
                    
                    <p style={{ marginTop: '20px', lineHeight: '1.6' }}>
                        こちらが {product.product_name} の詳細説明です。
                    </p>
                    
                    <button style={{ 
                        marginTop: '30px', 
                        padding: '10px 20px', 
                        fontSize: '18px', 
                        backgroundColor: '#0070f3', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '5px' 
                    }}>
                        カートに追加
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- 3. メタデータの生成 (オプション) ---
export async function generateMetadata({ params }: ProductDetailPageProps) {
    // ... (省略)
    return {
        title: `商品ID ${params.id} の詳細 | bic-saving.com`,
    };
}