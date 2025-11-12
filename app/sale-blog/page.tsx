// app/sale-blog/page.tsx

import { getSalePosts, getFeaturedImageUrl, Post } from "@/lib/wordpress"; 
import Link from 'next/link';
import Image from 'next/image'; 
import type { Metadata } from 'next'; // ★★★ Metadataの型をインポート ★★★

// ISR の設定: 1時間 (3600秒) ごとにバックグラウンドで再生成
export const revalidate = 3600; 

// ★★★ SEO対策: Metadataの定義を追加 ★★★
export const metadata: Metadata = {
    // ページタイトル: ブログのテーマを反映させる
    title: '【セール情報】リンクシェア最新情報一覧 | bic-saving',
    
    // ディスクリプション: ページの内容を簡潔に説明し、キーワードを含める
    description: 'bic-savingが取り扱う商品のリンクシェア広告を利用した最新のセール、キャンペーン情報、お得な情報を一覧でご紹介。毎日更新！',
    
    // Canonical URL: 重複コンテンツを避けるための必須設定
    alternates: {
        canonical: 'https://www.bic-saving.com/sale-blog',
    },
    
    // OGP設定 (SNSでの表示)
    openGraph: {
        title: '【セール情報】リンクシェア最新情報一覧 | bic-saving',
        description: 'bic-savingが取り扱う商品のリンクシェア広告を利用した最新のセール、キャンペーン情報、お得な情報を一覧でご紹介。',
        url: 'https://www.bic-saving.com/sale-blog',
        siteName: 'bic-saving EC & Blog',
        type: 'website',
        // images: ['/path/to/default/ogp_image.jpg'], // OGP画像があれば追加
    },
    
    // ロボット設定 (検索エンジンのクロール許可)
    robots: {
        index: true,
        follow: true,
    }
};


// Server Componentとしてデータを取得するため async function にする
export default async function SaleBlogPage() {
    let posts: Post[] = [];
    
    // データ取得処理
    try {
        // WordPress APIから記事一覧を取得
        // ★ getSalePosts()はクエリパラメータ（categoryなど）を考慮する必要があるが、ここでは省略 ★
        posts = await getSalePosts(); 
    } catch (error) {
        console.error("Failed to fetch posts:", error);
        // データ取得に失敗した場合のフォールバックUI
        return (
            <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
                <h1>リンクシェア セール情報一覧</h1>
                <p>※ このページはWordPressから自動取得されています。</p>
                <div style={{ color: 'red', border: '1px solid red', padding: '15px' }}>
                    <h1>データの取得に失敗しました。</h1>
                    <p>WordPress APIの確認をお願いします。コンソールに詳細エラーが出力されています。</p>
                </div>
            </main>
        );
    }
    
    return (
        <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* ★★★ SEO対策: H1タグがページのメインテーマを正確に表現していることを確認 ★★★ */}
            <h1>リンクシェア セール情報一覧</h1>
            <p>※ このページはWordPressから自動取得されています。</p>
            
            {/* 記事リストの表示 */}
            {posts.map((post) => {
                const imageUrl = getFeaturedImageUrl(post); // 画像URLを取得
                
                return (
                    // ★★★ SEO対策: article要素の適切な使用 ★★★
                    <article key={post.id} style={{ 
                        display: 'flex', 
                        border: '1px solid #ddd', 
                        borderRadius: '8px', 
                        marginBottom: '30px' 
                    }}>
                        
                        {/* アイキャッチ画像表示エリア */}
                        {imageUrl && (
                            <div style={{ width: '300px', flexShrink: 0 }}>
                                <Link href={`/sale-blog/${post.slug}`}>
                                    <Image 
                                        src={imageUrl} 
                                        // ★★★ SEO対策: alt属性に記事タイトルを含める ★★★
                                        alt={`セール情報: ${post.title.rendered}`} 
                                        width={300}
                                        height={200} // レイアウトシフト防止のため高さを指定
                                        style={{ width: '100%', height: 'auto', objectFit: 'cover', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}
                                    />
                                </Link>
                            </div>
                        )}

                        {/* テキストコンテンツエリア */}
                        <div style={{ padding: '20px' }}>
                            <Link href={`/sale-blog/${post.slug}`} style={{ textDecoration: 'none' }}>
                                {/* ★★★ SEO対策: 記事リストのタイトルはh2タグを使用 (H1はページタイトルで使用済み) ★★★ */}
                                <h2 
                                    style={{ color: '#0070f3', marginBottom: '5px' }} 
                                    dangerouslySetInnerHTML={{ __html: post.title.rendered }} 
                                />
                            </Link>
                            
                            <p style={{ color: '#666', fontSize: '0.9em' }}>
                                公開日: {new Date(post.date).toLocaleDateString('ja-JP')}
                            </p>
                            
                            {/* コンテンツの抜粋を表示 */}
                            <div 
                                style={{ marginTop: '15px' }} 
                                // ★★★ SEO対策: 抜粋は post.excerpt.rendered を使用するのが望ましい (APIレスポンスによる) ★★★
                                dangerouslySetInnerHTML={{ __html: post.content.rendered.substring(0, 200) + '...' }} 
                            />
                            
                            <Link href={`/sale-blog/${post.slug}`} style={{ display: 'inline-block', marginTop: '10px', textDecoration: 'underline' }}>
                                詳細を見る &rarr;
                            </Link>
                        </div>
                        
                    </article>
                );
            })}
            
            {/* 記事が見つからなかった場合のメッセージ */}
            {posts.length === 0 && <p style={{ marginTop: '30px' }}>現在、表示できるセール情報はありません。</p>}
        </main>
    );
}