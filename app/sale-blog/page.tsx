// /app/sale-blog/page.tsx (最終版 - ページネーション対応)

// 'use client' は削除済みで、Server Componentとして動作します

// ★ 新しいインポート: Pagination コンポーネント ★
import Pagination from '@/app/components/Pagination'; 
// ★ 修正済み: WordPress APIからデータを取得するための関数と型をインポート ★
import { 
    getSalePosts, 
    PostSummary, 
    getCategoryNameById, 
    getTagNameById,
    // 仮定されるレスポンス型
    PostListResponse 
} from "@/lib/wordpress"; 
import type { Metadata } from 'next'; 
// CSSモジュールをインポート
import styles from './post-list.module.css'; 
// Hydration Error 対策の子コンポーネントをインポート
import BlogListClient from './BlogListClient'; 

// ISR の設定: Server Componentでのみエクスポート可能
export const revalidate = 3600; 

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Default Site Name";
// ★ ページネーション設定 ★
const POSTS_PER_PAGE = 10; // 1ページあたりの記事数

// SEO対策: Metadataの定義: Server Componentでのみエクスポート可能
// ... (Metadataは省略。変更なし) ...
export const metadata: Metadata = {
    title: `【セール情報】リンクシェア最新情報一覧 | ${SITE_NAME}`, 
    description: `${SITE_NAME}が取り扱う商品のリンクシェア広告を利用した最新のセール、キャンペーン情報、お得な情報を一覧でご紹介。毎日更新！`, 
    alternates: {
        canonical: 'https://www.bic-saving.com/sale-blog',
    },
    openGraph: {
        title: `【セール情報】リンクシェア最新情報一覧 | ${SITE_NAME}`, 
        description: `${SITE_NAME}が取り扱う商品のリンクシェア広告を利用した最新のセール、キャンペーン情報、お得な情報を一覧でご紹介。`, 
        url: 'https://www.bic-saving.com/sale-blog',
        siteName: `${SITE_NAME} EC & Blog`, 
        type: 'website',
    },
    robots: {
        index: true,
        follow: true,
    }
};


// Server Componentとしてデータを取得するため async function にする
interface SaleBlogPageProps {
searchParams?: {
category?: string; // URLクエリ ?category=ID を受け取る
tag?: string; // URLクエリ ?tag=ID を受け取る
page?: string; // ★ 追加: URLクエリ ?page=N を受け取る ★
};
}

export default async function SaleBlogPage({ searchParams }: SaleBlogPageProps) {
    let posts: PostSummary[] = [];
    let totalPostsCount = 0; // ★ 総記事数 ★

    // searchParamsをawaitし、エラーを解消する
    const awaitedSearchParams = await searchParams;

    // awaitしたオブジェクトから安全に値を取得
    const categoryId = awaitedSearchParams?.category; // カテゴリIDを取得
    const tagId = awaitedSearchParams?.tag; // タグIDを取得
    // ★ ページ番号を取得、デフォルトは 1 ★
    const currentPage = parseInt(awaitedSearchParams?.page || '1', 10); 

    let pageTitle = 'リンクシェア セール情報一覧';
    
    // getSalePostsに渡すパラメータを準備
    let filterParams: { category?: string; tag?: string; page?: number; per_page?: number } = {
        page: currentPage, 
        per_page: POSTS_PER_PAGE, 
    }; 

    // 1. カテゴリIDまたはタグIDに基づいてタイトルを決定し、フィルタリングパラメータを設定
    // ... (中略: タイトル決定ロジックは変更なし) ...
    if (categoryId) {
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
        try {
            const tagName = await getTagNameById(parseInt(tagId));
            if (tagName) {
                pageTitle = `タグ: ${tagName} のセール情報一覧`;
            } else {
                pageTitle = `タグID ${tagId} に一致するセール情報一覧`;
                console.warn(`Tag ID ${tagId} found in query, but name not retrieved.`);
            }
        } catch (e) {
            console.error(`Failed to fetch tag name for ID: ${tagId}`, e);
        }
        filterParams.tag = tagId;
    }
    // ... (中略終わり) ...

    // 2. データ取得処理は Server Component で実行
    try {
        // filterParams が空の場合は全件取得（この場合 page/per_page は有効）
        const fetchedResponse = await getSalePosts(filterParams);

        if (fetchedResponse && Array.isArray(fetchedResponse.posts)) {
            posts = fetchedResponse.posts;
            totalPostsCount = fetchedResponse.totalCount; // ★ 総記事数を取得 ★
        } else {
            console.error("getSalePosts returned unexpected data structure.");
            posts = []; 
        }

    } catch (error) {
        console.error("Failed to fetch posts:", error);

        // データ取得に失敗した場合のフォールバックUI
        return (
            <main>
                <h2>{pageTitle}</h2>
                <div className={styles.errorMessage}>
                    <h1>データの取得に失敗しました。</h1>
                    <p>WordPress APIの設定を確認してください。コンソールに詳細エラーが出力されています。</p>
                </div>
            </main>
        );
    }
    
    // ★ ページネーション関連の計算 ★
    const totalPages = Math.ceil(totalPostsCount / POSTS_PER_PAGE);

    // Paginationコンポーネントに渡すベースパスを作成（page以外のパラメータを保持）
    const currentSearchParams = new URLSearchParams(awaitedSearchParams as Record<string, string>);
    currentSearchParams.delete('page'); 
    const basePathWithParams = `/sale-blog?${currentSearchParams.toString()}`;


    return (
        <main>
            <h2>{pageTitle}</h2>

            {/* postsは常に配列であるため、BlogListClientに安全に渡される */}
            <BlogListClient posts={posts} />

            {/* 記事が見つからなかった場合のメッセージ */}
            {posts.length === 0 && <p className={styles.noPostMessage}>現在、表示できるセール情報はありません。</p>}

            {/* ★ ページネーションの表示 ★ */}
            {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                    <Pagination
                        totalPages={totalPages}
                        currentPage={currentPage}
                        basePath={basePathWithParams}
                    />
                </div>
            )}
        </main>
    );
}