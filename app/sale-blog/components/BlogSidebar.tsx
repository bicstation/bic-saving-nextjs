// /app/sale-blog/components/BlogSidebar.tsx

import Link from 'next/link';
import React from 'react';

// Next.jsのベストプラクティスに従い、このコンポーネントは
// サーバーコンポーネント（デフォルト）としてデータを表示するだけにします。

// WordPress APIから取得するカテゴリ（ターム）の型
export interface WPCategory {
    id: number;
    name: string;
    slug: string;
    count: number;
}

// ECサイト APIから取得するカテゴリの型 (ダミー型として定義)
export interface Category {
    id: number;
    name: string;
    url: string;
}

// layout.tsx から渡される props の型定義
interface BlogSidebarProps {
    wpCategories: WPCategory[]; // WordPressカテゴリ
    ecCategories: Category[]; // ECサイトカテゴリ
    // layout.tsx からスタイルを受け取れるように style プロパティを追加
    style?: React.CSSProperties; 
}


// ★ BlogSidebar はサーバーコンポーネントのままにし、データは layout.tsx から受け取ります ★
export default function BlogSidebar({ wpCategories, ecCategories, style }: BlogSidebarProps) {
    
    // 取得したWordPressカテゴリデータを、記事数が多い順にソート（Top 10）
    const sortedWPCategories = [...wpCategories]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // 上位10件に制限
        
    // ECサイトカテゴリはそのまま使用 (Top N件はAPI側で制御されていると仮定)

    // スタイルオブジェクト
    const baseStyle: React.CSSProperties = {
        width: '280px', // layout.tsxで渡した width に近い値でデフォルト設定
        padding: '20px', 
        borderRight: '1px solid #ddd', 
        backgroundColor: '#f9f9f9',
        flexShrink: 0,
        ...style // layout.tsx から渡された style をマージ
    };

    const h3Style: React.CSSProperties = { 
        borderBottom: '2px solid #333', 
        paddingBottom: '5px', 
        marginBottom: '15px',
        fontSize: '1.2rem'
    };
    
    const ulStyle: React.CSSProperties = { 
        listStyle: 'none', 
        padding: 0 
    };
    
    const liStyle: React.CSSProperties = { 
        marginBottom: '8px' 
    };

    return (
        <aside style={baseStyle}>
            
            {/* 1. ブログカテゴリ (WordPress) */}
            <section style={{ marginBottom: '30px' }}>
                <h3 style={h3Style}>
                    ブログカテゴリ
                </h3>
                <ul style={ulStyle}>
                    {sortedWPCategories.map(cat => (
                        <li key={`wp-${cat.id}`} style={liStyle}>
                            <Link 
                                // WordPressのカテゴリIDでフィルタリングするリンク
                                href={`/sale-blog?category=${cat.id}`} 
                                style={{ textDecoration: 'none', color: '#0070f3' }}
                            >
                                {cat.name} ({cat.count})
                            </Link>
                        </li>
                    ))}
                    {sortedWPCategories.length === 0 && <p style={{ fontSize: '0.9em', color: '#888' }}>カテゴリはありません。</p>}
                </ul>
            </section>

            {/* 2. ECサイトカテゴリ (新規追加) */}
            <section style={{ marginBottom: '30px' }}>
                <h3 style={h3Style}>
                    ECサイトカテゴリ
                </h3>
                <ul style={ulStyle}>
                    {ecCategories.map(cat => (
                        <li key={`ec-${cat.id}`} style={liStyle}>
                            <Link 
                                // ECサイトのカテゴリページへのリンクを想定
                                href={cat.url} 
                                style={{ textDecoration: 'none', color: '#d90000' }}
                            >
                                {cat.name}
                            </Link>
                        </li>
                    ))}
                    {ecCategories.length === 0 && <p style={{ fontSize: '0.9em', color: '#888' }}>カテゴリの連携がありません。</p>}
                </ul>
            </section>
            
            {/* 3. ブログについて */}
            <section>
                <h3 style={h3Style}>
                    ブログについて
                </h3>
                <p style={{ fontSize: '0.9em', color: '#555' }}>
                    リンクシェア広告の最新セール情報を、Next.jsとWordPressの連携により自動更新でお届けしています。
                </p>
            </section>
        </aside>
    );
}