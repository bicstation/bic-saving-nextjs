// /app/components/ProductCard.tsx
import React from 'react';
import Link from 'next/link'; 
// ★修正: Product型とProductCardProps型をインポート
import { Product, ProductCardProps } from "@/types/index";

// Component
const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    return (
        <div className="product-card">
            {/* カード全体を商品詳細ページへのリンクにする */}
            <Link href={`/product/${product.id}`} passHref>
                <div className="product-image-wrapper">
                    <img 
                        // ★修正: product.image (統一されたプロパティ名) を使用
                        src={product.image || '/placeholder.png'} 
                        // ★修正: product.name (統一されたプロパティ名) を使用
                        alt={product.name} 
                        className="product-image" 
                    />
                </div>
                <div className="product-info">
                    {/* ★修正: product.name (統一されたプロパティ名) を使用 */}
                    <p className="product-name">{product.name}</p>
                    
                    <p className="product-price">
                        {/* ★修正: product.price (数値型) を使用 */}
                        {product.price.toLocaleString()}円
                    </p>
                    <p className="product-seller-info">
                        {/* 仮の出品者情報 */}
                        {product.category ? `カテゴリ: ${product.category}` : "詳細情報あり"}
                    </p>
                </div>
            </Link>
        </div>
    );
};

export default ProductCard;