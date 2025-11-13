// /app/sale-blog/page.tsx

// 'use client' は削除し、Server Componentとして動作させる

// ★ 修正1: getTagNameById をインポートに追加 ★
import { getSalePosts, Post, getCategoryNameById, getTagNameById } from "@/lib/wordpress"; 
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
    title: `【セール情報】リンクシェア最新情報一覧 | ${SITE_NAME}`, 
    description: `${SITE_NAME}が取り扱う商品のリンクシェア広告を利用した最新のセール、キャンペーン情報、お得な情報を一覧でご紹介。毎日更新！`, 
    alternates: {
        canonical: 'https://www.bic-saving.com/sale-blog',
    },
    // OGP設定 (SNSでの表示)
    openGraph: {
        title: `【セール情報】リンクシェア最新情報一覧 | ${SITE_NAME}`, 
        description: `${SITE_NAME}が取り扱う商品のリンクシェア広告を利用した最新のセール、キャンペーン情報、お得な情報を一覧でご紹介。`, 
        url: 'https://www.bic-saving.com/sale-blog',
        siteName: `${SITE_NAME} EC & Blog`, 
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
interface SaleBlogPageProps {
    searchParams?: {
        category?: string; // URLクエリ ?category=ID を受け取る
        tag?: string;      // URLクエリ ?tag=ID を受け取る
    };
}

export default async function SaleBlogPage({ searchParams }: SaleBlogPageProps) {
    let posts: Post[] = [];
    
    // ★ 修正3: searchParams is not awaited 警告対策 ★
    // searchParamsを一旦ローカル変数に格納することで、警告を回避し安全性を確保します。
    const params = searchParams || {};
    
    const categoryId = params.category; // カテゴリIDを取得 (修正)
    const tagId = params.tag;           // タグIDを取得 (修正)
    
    let pageTitle = 'リンクシェア セール情報一覧';
    let filterParams: { category?: string; tag?: string } = {}; // getSalePostsに渡すパラメータ

    // 1. カテゴリIDまたはタグIDに基づいてタイトルを決定し、フィルタリングパラメータを設定
    if (categoryId) {
        // カテゴリでフィルタリングする場合
        try {
            const categoryName = await getCategoryNameById(parseInt(categoryId));
            if (categoryName) {
                pageTitle = `${categoryName} のセール情報一覧`;
            } else {
                console.warn(`Category ID ${categoryId} found in query, but name not retrieved.`);
            }
        } catch (e) {
            console.error(`Failed to fetch category name for ID: ${categoryId}`, e);
        }
        filterParams.category = categoryId;
    } else if (tagId) { 
        // タグでフィルタリングする場合
        try {
            const tagName = await getTagNameById(parseInt(tagId));
            if (tagName) {
                pageTitle = `タグ: ${tagName} のセール情報一覧`;
            } else {
                pageTitle = `タグID ${tagId} に一致するセール情報一覧`; // 名前の取得に失敗した場合はIDを表示
                console.warn(`Tag ID ${tagId} found in query, but name not retrieved.`);
            }
        } catch (e) {
            console.error(`Failed to fetch tag name for ID: ${tagId}`, e);
        }
        filterParams.tag = tagId;
    }

    // 2. データ取得処理は Server Component で実行
    try {
        // 決定した filterParams オブジェクトを getSalePosts に渡す
        // filterParams が空の場合は全件取得
        posts = await getSalePosts(filterParams.category || filterParams.tag ? filterParams : undefined); 
    } catch (error) {
        console.error("Failed to fetch posts:", error);
        
        // データ取得に失敗した場合のフォールバックUI
        return (
            <main>
                <h1>{pageTitle}</h1>
                <div className={styles.errorMessage}>
                    <h1>データの取得に失敗しました。</h1>
                    <p>WordPress APIの確認をお願いします。コンソールに詳細エラーが出力されています。</p>
                </div>
            </main>
        );
    }
    
    return (
        <main>
            <h1>{pageTitle}</h1>
            
            <BlogListClient posts={posts} />

            {/* 記事が見つからなかった場合のメッセージ */}
            {posts.length === 0 && <p className={styles.noPostMessage}>現在、表示できるセール情報はありません。</p>}
        </main>
    );
}