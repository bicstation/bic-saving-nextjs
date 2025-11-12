// /app/sale-blog/page.tsx

import { getSalePosts, getFeaturedImageUrl, Post } from "@/lib/wordpress"; 
import Link from 'next/link';
import Image from 'next/image'; 
import type { Metadata } from 'next'; 
// ★★★ 修正1: CSSモジュール名を post-list.module.css に変更 (Module Not Foundエラー対策) ★★★
import styles from './post-list.module.css'; // 新しいCSSファイルを使用

// ISR の設定: 1時間 (3600秒) ごとにバックグラウンドで再生成
export const revalidate = 3600; 

// SEO対策: Metadataの定義
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
    posts = await getSalePosts(); 
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    
    // データ取得に失敗した場合のフォールバックUI
    return (
      <main>
        <h1>リンクシェア セール情報一覧</h1>
        <div className={styles.errorMessage}>
          <h1>データの取得に失敗しました。</h1>
          <p>WordPress APIの確認をお願いします。コンソールに詳細エラーが出力されています。</p>
        </div>
      </main>
    );
  }
  
  return (
    // ★★★ 修正2: mainタグにはインラインスタイルを使用しない ★★★
    <main>
      <h1>リンクシェア セール情報一覧</h1>
      <p>※ このページはWordPressから自動取得されています。</p>
      
      {/* 記事リストの表示 */}
      {posts.map((post) => {
        const imageUrl = getFeaturedImageUrl(post); 
        
        return (
          // ★★★ 修正3: articleタグのインラインスタイルをクラスに置換 ★★★
          <article key={post.id} className={styles.articleCard}>
            
            {/* アイキャッチ画像表示エリア */}
            {imageUrl && (
              // ★★★ 修正4: インラインスタイルをクラスに置換 ★★★
              <div className={styles.imageWrapper}>
                <Link href={`/sale-blog/${post.slug}`} className={styles.imageLink}>
                  <Image 
                    src={imageUrl} 
                    alt={`セール情報: ${post.title.rendered}`} 
                    width={300}
                    height={200} 
                    // style属性もクラスに移行
                    className={styles.articleImage} 
                  />
                </Link>
              </div>
            )}

            {/* テキストコンテンツエリア */}
            
            <div className={styles.articleContent}>
              <Link href={`/sale-blog/${post.slug}`} className={styles.titleLink}>
                {/* h2タグのインラインスタイルをクラスに置換 */}
                <h2 
                  className={styles.articleTitle} 
                  dangerouslySetInnerHTML={{ __html: post.title.rendered }} 
                />
              </Link>
              
              {/* 日付のインラインスタイルをクラスに置換 */}
              <p className={styles.articleDate}>
                公開日: {new Date(post.date).toLocaleDateString('ja-JP')}
              </p>
              
              {/* 抜粋のインラインスタイルをクラスに置換 */}
              <div 
                className={styles.articleExcerpt} 
                dangerouslySetInnerHTML={{ __html: post.content.rendered.substring(0, 200) + '...' }} 
              />
              
              {/* Hydrationエラーの原因となりやすいインラインスタイルを排除し、CSSモジュールを使用 */}
              <Link href={`/sale-blog/${post.slug}`} className={styles.detailLink}>
                詳細を見る &rarr;
              </Link>
            </div>
          </article>
        );
      })}
      
      {/* 記事が見つからなかった場合のメッセージ */}
      {posts.length === 0 && <p className={styles.noPostMessage}>現在、表示できるセール情報はありません。</p>}
    </main>
  );
}