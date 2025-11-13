// /app/sale-blog/page.tsx

// 'use client' は削除し、Server Componentとして動作させる

import { getSalePosts, Post } from "@/lib/wordpress"; 
import type { Metadata } from 'next'; 
// CSSモジュールをインポート
import styles from './post-list.module.css'; 
// ★ Hydration Error 対策の子コンポーネントをインポート ★
import BlogListClient from './BlogListClient'; 

// ISR の設定: Server Componentでのみエクスポート可能
export const revalidate = 3600; 

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Default Site Name";

// SEO対策: Metadataの定義: Server Componentでのみエクスポート可能
export const metadata: Metadata = {
    title: '【セール情報】リンクシェア最新情報一覧 | ${SITE_NAME}',
    description: 'ビック的節約生活が取り扱う商品のリンクシェア広告を利用した最新のセール、キャンペーン情報、お得な情報を一覧でご紹介。毎日更新！',
    alternates: {
        canonical: 'https://www.bic-saving.com/sale-blog',
    },
    // OGP設定 (SNSでの表示)
    openGraph: {
        title: '【セール情報】リンクシェア最新情報一覧 | ${SITE_NAME}',
        description: '${SITE_NAME}が取り扱う商品のリンクシェア広告を利用した最新のセール、キャンペーン情報、お得な情報を一覧でご紹介。',
        url: 'https://www.bic-saving.com/sale-blog',
        siteName: '${SITE_NAME} EC & Blog',
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
    
    // データ取得処理は Server Component で実行
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
        <main>
            <h1>リンクシェア セール情報一覧</h1>
            
            {/* 修正: 記事リストのレンダリングを Client Componentに委譲し、データを props で渡す */}
            <BlogListClient posts={posts} />

            {/* 記事が見つからなかった場合のメッセージ */}
            {posts.length === 0 && <p className={styles.noPostMessage}>現在、表示できるセール情報はありません。</p>}
        </main>
    );
}