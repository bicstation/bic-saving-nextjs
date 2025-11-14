// /app/components/ProductGrid.tsx (最終確定版 - CSS Grid強制適用)

import React from 'react';
import { Product } from '@/types/index';
import ProductCard from './ProductCard'; 

interface ProductGridProps {
    products: Product[];
}

const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
    return (
        <div 
            className="product-grid-container mt-5"
            // ★★★ 修正箇所: style属性で、個別ページと同じ CSS Grid を適用 ★★★
            style={{
                display: 'grid',
                // 6列表示（約1/6幅）に必要な最小幅 200px を設定
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '16px', // Tailwindの gap-4 (16px) に相当
                width: '100%' // 親の幅を完全に使う
            }}
        >
            {products.map((product) => (
                // ProductCard には引き続き width 系のクラスは不要です
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
};

export default ProductGrid;