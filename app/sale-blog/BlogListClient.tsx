// /app/sale-blog/BlogListClient.tsx

'use client'; // ★★★ Hydration Error 対策として維持 ★★★

// ★ 修正1: PostSummary をインポートに追加し、PostSummary を使用 ★
import { getFeaturedImageUrl, PostSummary, Post } from "@/lib/wordpress"; 
import Link from 'next/link';
import Image from 'next/image'; 
import styles from './post-list.module.css'; 

// ★ 修正2: Post[] ではなく PostSummary[] を使用するように型定義を修正 ★
interface BlogListClientProps {
    posts: PostSummary[];
}

/**
 * 記事のコンテンツから安全に抜粋を生成する関数。
 * Runtime TypeError: Cannot read properties of undefined (reading 'indexOf') 対策
 */
const getSafeExcerpt = (content: any): string => {
    // content.rendered が存在し、かつ文字列であることをチェック
    if (typeof content?.rendered === 'string' && content.rendered.length > 0) {
        // HTMLタグを除去し、安全に文字列を抽出
        const cleanText = content.rendered.replace(/<[^>]*>?/gm, '');
        return cleanText.substring(0, 200) + '...';
    }
    return '記事の抜粋がありません。';
};


export default function BlogListClient({ posts }: BlogListClientProps) {
    
    // Server Component側 (page.tsx)で既にチェックされているが、念のため
    if (!posts || posts.length === 0) {
        return null; 
    }

    return (
        <div className={styles.postList}> 
            {posts.map((post) => {
                // getFeaturedImageUrl は Post 型を引数にとるため、一時的な型アサーションを使用
                // ただし、post.content を使用しないため、PostSummary のままで動作します
                const imageUrl = getFeaturedImageUrl(post as Post); 
                
                return (
                    <article key={post.id} className={styles.articleCard}>
                        
                        {/* アイキャッチ画像表示エリア */}
                        {imageUrl && (
                            <div className={styles.imageWrapper}>
                                <Link href={`/sale-blog/${post.slug}`} className={styles.imageLink}>
                                    <Image 
                                        src={imageUrl} 
                                        alt={`セール情報: ${post.title.rendered}`} 
                                        width={300}
                                        height={200} 
                                        className={styles.articleImage} 
                                        sizes="(max-width: 768px) 100vw, 300px" 
                                        priority={false}
                                    />
                                </Link>
                            </div>
                        )}

                        {/* テキストコンテンツエリア */}
                        <div className={styles.articleContent}>
                            <h2 className={styles.articleTitle}>
                                <Link href={`/sale-blog/${post.slug}`} className={styles.titleLink}>
                                    {/* post.title.renderedは通常HTML文字列なので、そのまま表示 */}
                                    <span dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                                </Link>
                            </h2>
                            
                            <p className={styles.articleDate}>
                                公開日: {new Date(post.date).toLocaleDateString('ja-JP')}
                            </p>
                            
                            <div 
                                className={styles.articleExcerpt} 
                                // ★★★ 修正3: content ではなく excerpt (抜粋) を使用するように修正 ★★★
                                dangerouslySetInnerHTML={{ __html: getSafeExcerpt(post.excerpt) }} 
                            />
                            
                            <Link href={`/sale-blog/${post.slug}`} className={styles.detailLink}>
                                詳細を見る &rarr;
                            </Link>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}