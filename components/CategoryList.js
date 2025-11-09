// components/CategoryList.js

import Link from 'next/link';
import { getCategories } from '@/lib/categories';

// 子カテゴリを再帰的に表示するコンポーネント
const CategoryItem = ({ category }) => {
  const hasChildren = category.children && category.children.length > 0;
  
  // 例: カテゴリ名と商品数を表示
  return (
    <li key={category.id}>
      <Link href={`/category/${category.id}`}>
        {category.name} ({category.product_count}件)
      </Link>
      
      {/* 子カテゴリがあれば再帰的に表示 */}
      {hasChildren && (
        <ul style={{ paddingLeft: '20px', listStyleType: 'circle' }}>
          {category.children.map(child => (
            <CategoryItem key={child.id} category={child} />
          ))}
        </ul>
      )}
    </li>
  );
};

// メインのカテゴリリストコンポーネント
export default async function CategoryList() {
  const categories = await getCategories(); // データを取得

  if (!categories || categories.length === 0) {
    return <p>カテゴリデータがありません。</p>;
  }

  return (
    <nav>
      <h2>🛍️ カテゴリナビゲーション</h2>
      <ul style={{ listStyleType: 'disc' }}>
        {categories.map(category => (
          <CategoryItem key={category.id} category={category} />
        ))}
      </ul>
    </nav>
  );
}