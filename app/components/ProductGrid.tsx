// /app/components/ProductGrid.tsx (レスポンシブ6列表示)

import React from 'react';
import { Product } from '@/types/index'; 
import ProductCard from '@/app/components/ProductCard'; 

interface ProductGridProps {
  products: Product[];
}

/**
 * 商品一覧をグリッドレイアウトで表示する汎用コンポーネント
 * - レスポンシブ設定:
 * - モバイル (default): 2列
 * - sm (640px~): 3列
 * - md (768px~): 4列
 * - lg (1024px~): 5列
 * - xl (1280px~): 6列
 */
const ProductGrid: React.FC<ProductGridProps> = ({ products }) => { 
  if (!products || products.length === 0) {
    return <p>該当する商品が見つかりませんでした。</p>;
  }
  
  return (
    <div 
      // ★★★ 修正箇所: grid-cols-6 ではなく、 xl:grid-cols-6 を使用して6列を保証 ★★★
      className="product-grid-container grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 mt-5"
    >
      {products.map(product => (
        <ProductCard key={product.id} product={product} /> 
      ))}
    </div>
  );
};

export default ProductGrid;