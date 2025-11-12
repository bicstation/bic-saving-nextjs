// app/sale-blog/[slug]/page.tsx
import { getPostBySlug, getFeaturedImageUrl, Post, getSalePosts } from "@/lib/wordpress"; 
import { notFound } from "next/navigation";
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next'; 

// ISR の設定: 1時間 (3600秒) ごとにバックグラウンドで再生成
export const revalidate = 3600; 

// ... (generateStaticParamsは変更なし) ...

interface PostDetailPageProps {
    params: { slug: string };
}

// 記事データに基づいて動的なメタデータ (SEO) を生成
export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {
    
    // ★★★ 修正: paramsを強制的に await してから slug にアクセスする ★★★
    const resolvedParams = await params; 
    const post = await getPostBySlug(resolvedParams.slug); 

    if (!post) {
        return {};
    }

    const descriptionHtml = post.excerpt?.rendered || post.content.rendered;
    const description = descriptionHtml.replace(/<[^>]*>/g, '').substring(0, 160);
    
    const imageUrl = getFeaturedImageUrl(post);
    const postUrl = `https://www.bic-saving.com/sale-blog/${post.slug}`;

    return {
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


export default async function PostDetailPage({ params }: PostDetailPageProps) {
    
    // ★★★ 修正: paramsを強制的に await してから slug にアクセスする ★★★
    const resolvedParams = await params;
    
    // URLから受け取ったスラッグで記事データを取得
    const post = await getPostBySlug(resolvedParams.slug); 
    const imageUrl = post ? getFeaturedImageUrl(post) : null;

    if (!post) {
        notFound();
    }

    return (
        <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
            <Link href="/sale-blog" style={{ marginBottom: '20px', display: 'block', textDecoration: 'underline' }}>
                &larr; 一覧に戻る
            </Link>
            
            <h1 style={{ marginBottom: '10px' }} 
                dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
            
            <p style={{ color: '#666', fontSize: '0.9em', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '30px' }}>
                公開日: {new Date(post.date).toLocaleDateString('ja-JP')}
            </p>
            
            {imageUrl && (
                <div style={{ marginBottom: '30px' }}>
                    <Image 
                        src={imageUrl} 
                        alt={`セール情報: ${post.title.rendered} | bic-saving`}
                        width={800} 
                        height={500} 
                        style={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '8px' }}
                    />
                </div>
            )}
            
            <div className="post-content">
                <div dangerouslySetInnerHTML={{ __html: post.content.rendered }} />
            </div>
            
            <Link href="/sale-blog" style={{ marginTop: '40px', display: 'block', textDecoration: 'underline' }}>
                &larr; 一覧に戻る
            </Link>
        </main>
    );
}