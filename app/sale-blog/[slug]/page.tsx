// /app/sale-blog/[slug]/page.tsx

import { getPostBySlug, getFeaturedImageUrl, Post, getPosts } from "@/lib/wordpress"; 
import { notFound } from "next/navigation";
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next'; 

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
    
    const post = await getPostBySlug(resolvedParams.slug); 
    const imageUrl = post ? getFeaturedImageUrl(post) : null;

    if (!post) {
        notFound();
    }
    
    const processedContent = post.content.rendered;


    return (
        {/* mainタグからインラインスタイルを削除し、レイアウトに任せる */}
        <main className="post-detail-main">
            {/* ★★★ 修正済み: 構文エラーと style 属性を解消 ★★★ */}
            <Link href="/sale-blog" className="back-link">
                &larr; 一覧に戻る
            </Link>
            
            <h1 className="post-title"
                dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
            
            <p className="post-meta">
                公開日: {new Date(post.date).toLocaleDateString('ja-JP')}
            </p>
            
            {imageUrl && (
                <div className="featured-image-wrapper">
                    <Image 
                        src={imageUrl} 
                        alt={`セール情報: ${post.title.rendered} | bic-saving`}
                        width={800}
                        height={500}
                    />
                </div>
            )}
            
            <div className="post-content">
                <div dangerouslySetInnerHTML={{ __html: processedContent }} />
            </div>
            
            {/* ★★★ 修正済み: style属性を削除し、CSSクラスに移行 ★★★ */}
            <Link href="/sale-blog" className="back-link-bottom">
                &larr; 一覧に戻る
            </Link>
        </main>
    );
}