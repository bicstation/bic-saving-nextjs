// /app/sale-blog/[slug]/page.tsx

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getPostBySlug, getPosts, getCategoryNameById } from "@/lib/wordpress"; 
import Script from 'next/script';
import Link from 'next/link';

// ISR設定: 1時間 (3600秒) ごとに再生成
export const revalidate = 3600; 

// ★★★ 修正1: 以前の会話でmaxWidthを削除したため、layout.tsxのCSSに任せる ★★★
// BlogSidebarコンポーネントがClient Componentであるため、Layout.tsxでClient Componentにラッパーしている場合、ここでは不要です。
// レイアウトのスタイルはlayout.tsx側で一括管理します。
const postDetailStyle: React.CSSProperties = {
    // 以前のインラインスタイルを削除
};

/**
 * 動的なメタデータを生成 (Static Generation)
 */
export async function generateMetadata({ 
    params 
}: { 
    params: { slug: string } 
}): Promise<Metadata> {
    const post = await getPostBySlug(params.slug);

    if (!post) {
        return {};
    }

    const title = post.title.rendered;
    const description = post.excerpt.rendered.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...';

    return {
        title: title,
        description: description,
        // OGP画像はWordPressのfeatured_media URLを使用するか、デフォルトを設定
        openGraph: {
            title: title,
            description: description,
            url: `${process.env.NEXT_PUBLIC_PRODUCTION_URL}/sale-blog/${params.slug}`,
            images: post.featured_media_url ? [post.featured_media_url] : ['/og-image.png'],
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
            images: post.featured_media_url ? [post.featured_media_url] : ['/og-image.png'],
        }
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

// メインのコンポーネント
export default async function PostDetailPage({ params }: { params: { slug: string } }) {
    const post = await getPostBySlug(params.slug);

    if (!post) {
        notFound();
    }
    
    // カテゴリ名を取得
    const categoryName = post.categories && post.categories.length > 0
        ? await getCategoryNameById(post.categories[0])
        : null;

    // ★★★ 修正箇所: convertToAffiliateLink の呼び出しを完全に削除 ★★★
    // Rawコンテンツをそのまま表示変数に代入
    const processedContent = post.content.rendered;

    return (
        // ★★★ 修正箇所: インラインスタイルを削除し、layout.tsxに任せる ★★★
        // layout.tsxがブログ全体で幅を制御するため、ここではパディングのみにすることが多いですが、
        // layout.tsx側の設計に合わせて、ここではインラインスタイルを完全に削除します。
        <main> 
            <div style={{ padding: '20px 0' }}>
                {categoryName && (
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>
                        カテゴリ: <Link href={`/sale-blog/category/${post.categories[0]}`} style={{ color: '#007bff' }}>{categoryName}</Link>
                    </p>
                )}
                
                <h1 style={{ fontSize: '2.2rem', marginBottom: '15px' }}>{post.title.rendered}</h1>
                
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    公開日: {new Date(post.date).toLocaleDateString('ja-JP')}
                </p>

                {/* 記事のコンテンツを表示 */}
                {/* ★★★ 修正: 生のコンテンツ (processedContent) を使用して HTML を表示 ★★★ */}
                <div 
                    dangerouslySetInnerHTML={{ __html: processedContent }} 
                    style={{ lineHeight: 1.8 }}
                />

                <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px dashed #ccc', textAlign: 'center' }}>
                    <Link href="/sale-blog" style={{ textDecoration: 'underline' }}>
                        &larr; セール情報一覧へ戻る
                    </Link>
                </div>
            </div>
        </main>
    );
}