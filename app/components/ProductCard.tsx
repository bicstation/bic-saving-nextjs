// /app/components/ProductCard.tsx (divをルート要素に変更)

import React from 'react';
import Link from 'next/link'; 
import { Product, ProductCardProps } from "@/types/index";

// Component
const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    // グリッドアイテムとしてのルート要素を div に変更
    return (
        <div className="product-card">
            
            {/* リンクを div 内に配置し、カードの全体的なスタイルは div が持つ */}
            <Link 
                href={`/product/${product.id}`} 
                className="block h-full" // カード全体をクリック可能にするために block h-full を適用
                passHref
            >
                {/* カード内部のコンテンツを縦に整えるための flex-col は維持 */}
                <div className="flex flex-col h-full justify-between">
                    
                    {/* 1. 画像セクション */}
                    <div className="product-image-wrapper">
                        <img 
                            src={product.image || product.image_url || '/placeholder.png'} 
                            alt={product.name} 
                            className="product-image" 
                        />
                    </div>
                    
                    {/* 2. 情報セクション (flex-growでスペースを占める) */}
                    <div className="product-info flex-grow">
                        <p className="product-name">{product.name}</p>
                    </div>
                    
                    {/* 3. 価格・情報セクション (mt-autoで下に寄せる) */}
                    <div className="mt-auto">
                        <p className="product-price">
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