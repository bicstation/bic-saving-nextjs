// /app/components/BlogSidebar.tsx

import Link from 'next/link';
// CSSProperties を使用するためにインポート
import React, { CSSProperties } from 'react'; 

// WordPress APIから取得するカテゴリ（ターム）の型 (実際は lib からインポート推奨)
interface WPCategory {
    id: number;
    name: string;
    slug: string;
    count: number;
}
// ECサイト APIから取得するカテゴリの型 (実際は lib からインポート推奨)
interface Category {
    id: number;
    name: string;
    product_count: number;
    children: Category[];
}

// Propsの型定義を修正し、style prop を追加
interface BlogSidebarProps {
    wpCategories: WPCategory[];
    ecCategories: Category[];
    // ★ 修正: layout.tsxからの style prop の型定義を追加 ★
    style?: CSSProperties; 
}

// props として style を受け取り、最上位の要素に適用
export default function BlogSidebar({ wpCategories, ecCategories, style }: BlogSidebarProps) {
    
    // WordPressカテゴリの処理
    const filteredWPCategories = wpCategories.filter(cat => cat && cat.count > 0 && cat.slug !== 'uncategorized');
    const sortedWPCategories = [...filteredWPCategories]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); 
    
    // ECカテゴリの処理
    const topECCategories = ecCategories.slice(0, 5);


    return (
        // ★ style prop を適用 ★
        <aside className="blog-sidebar" style={style}>
            
            {/* 1. サイト全体メニュー (インラインスタイルを削除) */}
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
            
            {/* 2. 動的に取得したブログカテゴリ (WordPress) (インラインスタイルを削除) */}
            <section className="sidebar-section">
                <h3 className="section-title">
                    ブログカテゴリ
                </h3>
                <ul className="link-list">
                    {/* cat が undefined/null でないかチェックを追加 */}
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
            
            {/* 3. メインのコンテンツ（ECサイト）カテゴリを追加 (インラインスタイルを削除) */}
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

            {/* 4. ブログについての説明 (インラインスタイルを削除) */}
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