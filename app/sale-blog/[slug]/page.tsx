// /app/sale-blog/[slug]/page.tsx

import { getPostBySlug, getFeaturedImageUrl, getPosts } from "@/lib/wordpress"; 
import { notFound } from "next/navigation";
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next'; 
// CSSモジュールをインポート
import styles from './post-detail.module.css';

// ISR の設定: 1時間 (3600秒) ごとにバックグラウンドで再生成
export const revalidate = 3600; 

// PostDetailPageコンポーネントで使う型定義を再配置
interface PostDetailPageProps {
    params: { slug: string };
}


/**
 * 動的なメタデータを生成 (Static Generation)
 */
export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {
    
    const resolvedParams = await params; 
    const post = await getPostBySlug(resolvedParams.slug); 

    if (!post) {
        return {};
    }

    // 記事の抜粋またはコンテンツからHTMLタグを除去し、160文字に切り詰める
    const descriptionHtml = post.excerpt?.rendered || post.content.rendered;
    const description = descriptionHtml.replace(/<[^>]*>/g, '').substring(0, 160);
    
    const imageUrl = getFeaturedImageUrl(post);
    // 環境変数を使用するか、ハードコードされたURLを使用
    const postUrl = `https://www.bic-saving.com/sale-blog/${post.slug}`;

    return {
        // タイトルからHTMLタグを除去
        title: `${post.title.rendered.replace(/<[^>]*>/g, '')} | bic-saving セール情報`,
        description: description,
        alternates: {
            canonical: postUrl,
        },
        openGraph: {
            title: post.title.rendered.replace(/<[^>]*>/g, ''),
            description: description,
            url: postUrl,
            type: 'article', 
            // images プロパティはURLの配列を期待
            images: imageUrl ? [{ url: imageUrl }] : undefined,
        },
    };
}

/**
 * 動的な静的パスを生成 (Static Generation)
 */
export async function generateStaticParams() {
    const posts = await getPosts(100); // 最新の100件からパスを生成
    return posts.map(post => ({
        slug: post.slug,
    }));
}


export default async function PostDetailPage({ params }: PostDetailPageProps) {
    
    const resolvedParams = await params;
    
    // データ取得
    const post = await getPostBySlug(resolvedParams.slug); 
    const imageUrl = post ? getFeaturedImageUrl(post) : null;

    if (!post) {
        // 記事が見つからなかった場合は Next.js の 404 ページを表示
        notFound();
    }
    
    const processedContent = post.content.rendered;


    return (
        // ★ 構文エラーを避けるため、returnの直後にルート要素を配置 ★
        <main className={styles.postDetailMain}>
            
            {/* ★ インラインスタイルを完全に排除し、CSSモジュールを使用 ★ */}
            <Link href="/sale-blog" className={styles.backLink}>
                &larr; 一覧に戻る
            </Link>
            
            <h1 className={styles.postTitle}
                dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
            
            <p className={styles.postMeta}>
                公開日: {new Date(post.date).toLocaleDateString('ja-JP')}
            </p>
            
            {imageUrl && (
                <div className={styles.featuredImageWrapper}>
                    <Image 
                        src={imageUrl} 
                        alt={`セール情報: ${post.title.rendered} | bic-saving`}
                        width={800}
                        height={500}
                        // layoutは非推奨のため削除。CSSで幅を制御
                    />
                </div>
            )}
            
            <div className={styles.postContent}>
                <div dangerouslySetInnerHTML={{ __html: processedContent }} />
            </div>
            
            <Link href="/sale-blog" className={styles.backLinkBottom}>
                &larr; 一覧に戻る
            </Link>
        </main>
    );
}