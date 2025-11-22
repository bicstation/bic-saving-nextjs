// /app/components/ProductCard.tsx (最終確定修正版 + original_price対応 + 0円非表示)

import React from 'react';
import Link from 'next/link'; 
import { Product, ProductCardProps } from "@/types/index";

// Component
const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    
    // 現在の価格が存在し、かつ0円でない場合に true
    const hasValidPrice = product.price && product.price !== 0;

    // original_priceが存在し、現在の価格(price)よりも大きく、かつ0円でない場合に true
    const isDiscounted = 
        product.original_price && 
        product.original_price !== 0 && // ★★★ 修正: original_price が0でないことを確認 ★★★
        hasValidPrice && 
        product.original_price > product.price!; // hasValidPriceでチェック済みのため、非nullアサーションを使用

    return (
        <div className="product-card w-full max-w-full">
            
            <Link 
                href={`/product/${product.id}`} 
                className="block h-full w-full flex-shrink max-w-full" 
                passHref
            >
                <div className="flex flex-col h-full justify-between flex-shrink">
                    
                    {/* 1. 画像セクション */}
                    <div className="product-image-wrapper">
                        <img 
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
                        
                        {/* 割引前価格: isDiscounted が true の場合に表示 */}
                        {isDiscounted && product.original_price && (
                            <p className="product-original-price text-sm text-gray-500 line-through">
                                {product.original_price.toLocaleString()}円
                            </p>
                        )}
                        
                        {/* 現在の価格: hasValidPrice (価格があり、0円でない) の場合に表示 */}
                        {hasValidPrice ? (
                            <p className={`product-price font-bold ${isDiscounted ? 'text-red-600 text-xl' : 'text-lg'}`}>
                                {product.price!.toLocaleString()}円
                            </p>
                        ) : (
                            // 価格情報がない (priceがnull/undefinedまたは0) 場合
                            <p className="product-price text-gray-400 text-lg font-bold">
                                価格情報なし
                            </p>
                        )}
                        
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