// /app/sale-blog/components/BlogSidebar.tsx

import Link from 'next/link';

// WordPress APIから取得するカテゴリ（ターム）の型
interface WPCategory {
    id: number;
    name: string;
    slug: string;
    count: number;
}

// ダミーデータまたはAPIから取得したカテゴリデータを受け取る
interface BlogSidebarProps {
    categories: WPCategory[];
}

// ★ このコンポーネントはサーバーコンポーネントとして動作させる ★
export default function BlogSidebar({ categories }: BlogSidebarProps) {
    // 取得したカテゴリデータを、記事数が多い順にソート（Top 10）
    const sortedCategories = [...categories]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // 上位10件に制限

    return (
        <aside style={{ 
            width: '300px', 
            padding: '20px', 
            borderRight: '1px solid #ddd', // 左サイドバーなので右側に区切り線
            backgroundColor: '#f9f9f9',
            flexShrink: 0 
        }}>
            
            <section style={{ marginBottom: '30px' }}>
                <h3 style={{ borderBottom: '2px solid #333', paddingBottom: '5px', marginBottom: '15px' }}>
                    ブログカテゴリ
                </h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {sortedCategories.map(cat => (
                        <li key={cat.id} style={{ marginBottom: '8px' }}>
                            {/* ブログカテゴリへのリンク (ここでは slug ではなく ID を使用する例) */}
                            <Link 
                                href={`/sale-blog?category=${cat.id}`} 
                                style={{ textDecoration: 'none', color: '#0070f3' }}
                            >
                                {cat.name} ({cat.count})
                            </Link>
                        </li>
                    ))}
                    {sortedCategories.length === 0 && <p>カテゴリはありません。</p>}
                </ul>
            </section>
            
            <section>
                <h3 style={{ borderBottom: '2px solid #333', paddingBottom: '5px', marginBottom: '15px' }}>
                    ブログについて
                </h3>
                <p style={{ fontSize: '0.9em', color: '#555' }}>
                    リンクシェア広告の最新セール情報を、Next.jsとWordPressの連携により自動更新でお届けしています。
                </p>
            </section>
        </aside>
    );
}