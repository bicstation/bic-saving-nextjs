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

// ★ 修正1: paramsをawaitし、エラーを回避する ★
const awaitedParams = await params;
const slug = awaitedParams.slug;

// const resolvedParams = params; // 旧ロジックは不要
const post = await getPostBySlug(slug); // awaitした slug を使用 

if (!post) {
 return {};
}

// description の抽出をより防御的に行う 
const descriptionHtml = post.excerpt?.rendered || post.content?.rendered; 

let description = 'セール情報詳細ページです。'; // フォールバック値

if (descriptionHtml) {
 // HTMLタグを除去し、160文字に切り詰める
 description = descriptionHtml.replace(/<[^>]*>/g, '').substring(0, 160);
}

const imageUrl = getFeaturedImageUrl(post);
// 環境変数を使用するか、ハードコードされたURLを使用
const postUrl = `https://www.bic-saving.com/sale-blog/${post.slug}`;

return {
 // title から HTMLタグを除去
 title: `${post.title.rendered.replace(/<[^>]*>/g, '') || "記事タイトルなし"} | bic-saving セール情報`,
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
// getPosts の中で Null文字除去などの防御策が既に適用済み
const posts = await getPosts(100); 

if (!Array.isArray(posts)) {
 console.error("generateStaticParams: getPosts did not return an array.");
 return [];
}

// postが存在し、かつ slug が有効な文字列である記事のみをフィルターする (既存の安全なロジックを維持)
return posts
 .filter(post => post && typeof post.slug === 'string' && post.slug.length > 0)
 .map(post => ({
 slug: post.slug,
 }));
}


export default async function PostDetailPage({ params }: PostDetailPageProps) {

// ★ 修正2: paramsをawaitし、エラーを回避する ★
const awaitedParams = await params;
const slug = awaitedParams.slug; 

// const resolvedParams = params; // 旧ロジックは不要

// データ取得
const post = await getPostBySlug(slug); // awaitした slug を使用 
const imageUrl = post ? getFeaturedImageUrl(post) : null;

if (!post) {
 // 記事が見つからなかった場合は Next.js の 404 ページを表示
 notFound();
}

// post.content.rendered が存在しない場合は空文字列を使用
const processedContent = post.content?.rendered || "";


return (
 <main className={styles.postDetailMain}>
 
 <Link href="/sale-blog" className={styles.backLink}>
  &larr; 一覧に戻る
 </Link>
 
 <h1 className={styles.postTitle}
  // post.title.rendered が存在することは post の存在で保証されている
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
   sizes="(max-width: 768px) 100vw, 800px" // レスポンシブ対応を追加
   style={{ width: '100%', height: 'auto' }} // レスポンシブ対応を追加
   priority
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