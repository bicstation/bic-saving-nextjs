// E:\development\nextjs\bic-saving\app\components\BlogSidebar.tsx

import Link from 'next/link';

// WordPress APIから取得するカテゴリ（ターム）の型
// ★★★ WPCategoryの定義は通常、lib/wordpressからインポートすべきですが、ここでは便宜的に内部に定義します ★★★
// (実際には `import { WPCategory } from "@/lib/wordpress";` で済ませるのが理想です)
interface WPCategory {
    id: number;
    name: string;
    slug: string;
    count: number;
}
// ★★★ Categoryの定義も通常、lib/bic-savingからインポートすべきですが、ここでは便宜的に内部に定義します ★★★
// (実際には `import { Category } from "@/lib/bic-saving";` で済ませるのが理想です)
interface Category {
    id: number;
    name: string;
    product_count: number;
    children: Category[];
}

// Propsの型定義を修正し、wpCategories と ecCategories の両方に対応
interface BlogSidebarProps {
    wpCategories: WPCategory[];
    ecCategories: Category[]; // ECカテゴリを追加
}

// ★★★ 修正: Propsの受け取り方を wpCategories と ecCategories に分割する ★★★
export default function BlogSidebar({ wpCategories, ecCategories }: BlogSidebarProps) {
    
    // 1. WordPressカテゴリの処理 (wpCategoriesを使用)
    // エラーの原因となった 'categories' ではなく 'wpCategories' を使用
    const filteredWPCategories = wpCategories.filter(cat => cat.count > 0 && cat.slug !== 'uncategorized');
    const sortedWPCategories = [...filteredWPCategories]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); 
    
    // 2. ECカテゴリの処理（トップ5件のみ表示する例）
    const topECCategories = ecCategories.slice(0, 5);


    return (
        <aside style={{ 
            width: '300px', 
            padding: '20px', 
            borderRight: '1px solid #ddd', 
            backgroundColor: '#f9f9f9',
            flexShrink: 0 
        }}>
            
            {/* 1. サイト全体メニュー (グローバルナビゲーション) */}
            <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: 'white' }}>
                <h3 style={{ borderBottom: '2px solid #0070f3', paddingBottom: '5px', marginBottom: '15px', color: '#0070f3' }}>
                    サイト全体メニュー
                </h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '8px' }}><Link href="/" style={{ textDecoration: 'none' }}>ホームへ戻る</Link></li>
                    <li style={{ marginBottom: '8px' }}><Link href="/products" style={{ textDecoration: 'none' }}>全商品一覧</Link></li>
                    <li style={{ marginBottom: '8px' }}><Link href="/cart" style={{ textDecoration: 'none' }}>カートを見る</Link></li>
                    <li style={{ marginBottom: '8px' }}><Link href="/contact" style={{ textDecoration: 'none' }}>お問い合わせ</Link></li>
                </ul>
            </section>
            
            {/* 2. 動的に取得したブログカテゴリ (WordPress) */}
            <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '4px' }}>
                <h3 style={{ borderBottom: '2px solid #333', paddingBottom: '5px', marginBottom: '15px' }}>
                    ブログカテゴリ
                </h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {sortedWPCategories.map(cat => (
                        <li key={cat.id} style={{ marginBottom: '8px' }}>
                            <Link 
                                href={`/sale-blog?category=${cat.id}`} 
                                style={{ textDecoration: 'none', color: '#333' }}
                            >
                                {cat.name} ({cat.count})
                            </Link>
                        </li>
                    ))}
                    {sortedWPCategories.length === 0 && <p>カテゴリデータが見つかりませんでした。</p>}
                </ul>
            </section>
            
            {/* 3. メインのコンテンツ（ECサイト）カテゴリを追加 */}
            <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '4px' }}>
                <h3 style={{ borderBottom: '2px solid #D97706', paddingBottom: '5px', marginBottom: '15px', color: '#D97706' }}>
                    🛒 ECサイト 商品カテゴリ
                </h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {topECCategories.map(cat => (
                        <li key={cat.id} style={{ marginBottom: '8px' }}>
                            <Link href={`/category/${cat.id}`} style={{ textDecoration: 'none', color: '#D97706' }}>
                                {cat.name} {cat.product_count !== undefined && `(${cat.product_count.toLocaleString()})`}
                            </Link>
                        </li>
                    ))}
                    {topECCategories.length === 0 && <p>ECカテゴリデータが見つかりませんでした。</p>}
                    <li style={{ marginTop: '10px' }}>
                        <Link href="/products" style={{ textDecoration: 'none', color: '#555' }}>
                            ...全商品を見る
                        </Link>
                    </li>
                </ul>
            </section>

            {/* 4. ブログについての説明 */}
            <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '4px' }}>
                <h3 style={{ borderBottom: '2px solid #333', paddingBottom: '5px', marginBottom: '15px' }}>
                    ブログについて
                </h3>
                <p style={{ fontSize: '0.9em', color: '#555' }}>
                    当サイト（bic-saving.com）で提供しているリンクシェア広告の最新セール情報をお届けします。
                </p>
            </section>
        </aside>
    );
}