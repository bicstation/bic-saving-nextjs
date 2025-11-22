// /app/components/ProductCard.tsx (最終確定修正版 + original_price対応)

import React from 'react';
import Link from 'next/link'; 
import { Product, ProductCardProps } from "@/types/index";

// Component
const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    
    // original_priceが存在し、かつ現在の価格(price)よりも大きい場合にtrue
    const isDiscounted = 
        product.original_price && 
        product.price && 
        product.original_price > product.price;

    return (
        // ★★★ 修正箇所 1: ルート要素に w-full と max-w-full を適用 ★★★
        <div className="product-card w-full max-w-full">
            
            <Link 
                href={`/product/${product.id}`} 
                // ★★★ 修正箇所 2: aタグにも w-full と flex-shrink を適用 ★★★
                className="block h-full w-full flex-shrink max-w-full" 
                passHref
            >
                {/* 内部の div にも flex-shrink を適用 */}
                <div className="flex flex-col h-full justify-between flex-shrink">
                    
                    {/* 1. 画像セクション */}
                    <div className="product-image-wrapper">
                        <img 
                            // product.image_url は ApiProduct 側で取得し、Product 型の image にマッピングされているはず
                            src={product.image || '/placeholder.png'} 
                            alt={product.name} 
                            className="product-image" 
                        />
                    </div>
                    
                    {/* 2. 情報セクション */}
                    <div className="product-info flex-grow">
                        <p className="product-name">{product.name}</p>
                    </div>
                    
                    {/* 3. 価格・情報セクション */}
                    <div className="mt-auto">
                        
                        {/* ★★★ 修正箇所 3: original_price の表示ロジックを追加 ★★★ */}
                        {isDiscounted && product.original_price && (
                            <p className="product-original-price text-sm text-gray-500 line-through">
                                {product.original_price.toLocaleString()}円
                            </p>
                        )}
                        {/* ★★★ ------------------------------------------ ★★★ */}
                        
                        <p className={`product-price font-bold ${isDiscounted ? 'text-red-600 text-xl' : 'text-lg'}`}>
                            {product.price ? product.price.toLocaleString() : 'N/A'}円
                        </p>
                        
                        <p className="product-seller-info text-xs text-gray-500">
                            {product.category ? `カテゴリ: ${product.category}` : "詳細情報あり"}
                        </p>
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default ProductCard;