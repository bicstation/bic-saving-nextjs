// E:\development\nextjs\bic-saving\app\components\BlogSidebar.tsx

import Link from 'next/link';
import React, { CSSProperties } from 'react'; 
// ★ WPCategory と WPTag を lib/wordpress からインポート ★
import { WPCategory, WPTag } from "@/lib/wordpress"; 

// ★★★ 実際には lib/bic-saving からインポートすべき ★★★ (ECサイトのカテゴリ型はそのまま残します)
interface Category {
  id: number;
  name: string;
  product_count: number;
  children: Category[];
}

// Propsの型定義を修正
interface BlogSidebarProps {
  categories: WPCategory[]; 
  ecCategories: Category[]; 
  style?: CSSProperties; 
  tags: WPTag[];     
}

// ★修正: props として受け取る引数にデフォルト値を設定してエラーを回避★
export default function BlogSidebar({ 
    categories = [],    // ★修正: デフォルト値として空配列を設定
    ecCategories = [],  // ★修正: デフォルト値として空配列を設定
    tags = [],          // ★修正: デフォルト値として空配列を設定
    style 
}: BlogSidebarProps) {
  
  // 1. WordPressカテゴリの処理
  // categories には必ず配列が設定されるため、安全に filter が実行できる
  const filteredWPCategories = categories.filter(cat => cat.count > 0 && cat.slug !== 'uncategorized');
  const sortedWPCategories = [...filteredWPCategories]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); 
  
  // 2. ECカテゴリの処理（トップ5件のみ表示する例）
  const topECCategories = ecCategories.slice(0, 5);

  // 3. WordPressタグの処理（記事数が多いトップ10件のみ表示）
    const tagsToProcess = tags;
  
  const sortedWPTags = [...tagsToProcess] 
    .filter(tag => tag.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); 


  return (
    <aside className="blog-sidebar" style={style}>
      
      {/* 1. サイト全体メニュー */}
      <section className="sidebar-section">
        <h3 className="section-title menu-title">
          サイト全体メニュー
        </h3>
        <ul className="link-list">
          <li><Link href="/">ホームへ戻る</Link></li>
          <li><Link href="/products">全商品一覧</Link></li>
          <li><Link href="/cart">カートを見る</Link></li>
          <li><Link href="/contact">お問い合わせ</Link></li>
        </ul>
      </section>
      
      {/* 2. 動的に取得したブログカテゴリ (WordPress) */}
      <section className="sidebar-section">
        <h3 className="section-title">
          ブログカテゴリ
        </h3>
        <ul className="link-list">
          {sortedWPCategories.map(cat => (
            <li key={cat.id}>
              <Link 
                href={`/sale-blog?category=${cat.id}`} 
              >
                {cat.name} ({cat.count})
              </Link>
            </li>
          ))}
          {sortedWPCategories.length === 0 && <p className="no-data-message">カテゴリデータが見つかりませんでした。</p>}
        </ul>
      </section>

      {/* 3. 人気のタグセクションを追加 */}
      <section className="sidebar-section tag-section">
        <h3 className="section-title">
          人気のタグ
        </h3>
        <ul className="link-list tag-list">
          {sortedWPTags.map(tag => (
            <li key={tag.id}>
              <Link href={`/sale-blog?tag=${tag.id}`}>
                {tag.name} ({tag.count})
              </Link>
            </li>
          ))}
          {sortedWPTags.length === 0 && <p className="no-data-message">タグデータが見つかりませんでした。</p>}
        </ul>
      </section>
      
      {/* 4. メインのコンテンツ（ECサイト）カテゴリ */}
      <section className="sidebar-section">
        <h3 className="section-title ec-title">
          🛒 ECサイト 商品カテゴリ
        </h3>
        <ul className="link-list ec-link-list">
          {topECCategories.map(cat => (
            <li key={cat.id}>
              <Link href={`/category/${cat.id}`}>
                {cat.name} {cat.product_count !== undefined && `(${cat.product_count.toLocaleString()})`}
              </Link>
            </li>
          ))}
          {topECCategories.length === 0 && <p className="no-data-message">ECカテゴリデータが見つかりませんでした。</p>}
          <li className="all-products-link">
            <Link href="/products">
              ...全商品を見る
            </Link>
          </li>
        </ul>
      </section>
      
      {/* 5. ブログについての説明 */}
      <section className="sidebar-section info-section">
        <h3 className="section-title">
          ブログについて
        </h3>
        <p className="sidebar-description">
          当サイト（bic-saving.com）で提供しているリンクシェア広告の最新セール情報をお届けします。
        </p>
      </section>
    </aside>
  );
}