// /app/components/ProductGrid.tsx

import React from 'react';
import { Product } from '@/types/index';
import ProductCard from '@/app/components/ProductCard';

interface ProductGridProps {
    products: Product[];
    columns?: number;
}

/**
 * 商品一覧をグリッドレイアウトで表示する汎用コンポーネント
 * - レスポンシブ設定: モバイル2列 → デスクトップ6列
 */
const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
    if (!products || products.length === 0) {
        return <p>該当する商品が見つかりませんでした。</p>;
    }
    
    return (
        <div 
            // lg:grid-cols-6 を使用して、1024px以上で確実に6列を保証
            // カスタムCSSで強制的に6列を適用できるように、このクラス名はそのまま維持
            className="product-grid-container grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 mt-5"
        >
            {products.map(product => (
                <ProductCard key={product.id} product={product} /> 
            ))}
        </div>
    );
};

export default ProductGrid;