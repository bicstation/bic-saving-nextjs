// /app/sale-blog/[slug]/page.tsx

import { getPostBySlug, getFeaturedImageUrl, getPosts } from "@/lib/wordpress";
import { notFound } from "next/navigation";
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
// CSSモジュールをインポート
import styles from './post-detail.module.css';

// --- (インポート) アフィリエイトリンク生成とAPIラッパー ---
import { generateAffiliateUrl } from "@/lib/affiliate";
import { resolveMerchantId } from "@/lib/api";
// --- (インポート) HTML解析ライブラリ ---
import * as cheerio from 'cheerio';

// ★★★ リッチリンクカード機能のための追加インポート ★★★
import { fetchOGPData } from "@/lib/linkParser"; // OGP/ファビコン取得関数
import LinkCard from '../../components/LinkCard'; // リンクカードコンポーネント
import parse, { DOMNode, Element } from 'html-react-parser'; // ★追加: HTMLパースライブラリ
// ★★★ ----------------------------------------- ★★★


// ISR の設定: 1時間 (3600秒) ごとにバックグラウンドで再生成
export const revalidate = 3600;

// OGPDataの型定義
interface OGPData {
title: string | null;
description: string | null;
imageUrl: string | null;
siteUrl: string;
faviconUrl: string | null;
}
interface OGPDataMap {
[url: string]: OGPData;
}


// PostDetailPageコンポーネントで使う型定義を再配置
interface PostDetailPageProps {
params: { slug: string };
}

// L-Share/Rakuten Marketing のアフィリエイトドメインを定義
const AFFILIATE_DOMAIN = 'click.linksynergy.com';

/**
* 記事のHTMLコンテンツを処理し、アフィリエイトリンク変換とOGPデータ取得を行う
* @param htmlContent - WordPressから取得した生のHTMLコンテンツ
* @returns 変換後のHTMLコンテンツと、記事内リンクのOGPデータマップ (Promise)
*/
async function processPostContent(htmlContent: string): Promise<{ processedHtml: string, ogpMap: OGPDataMap }> {
const $ = cheerio.load(htmlContent, null, false);
const links = $('a');
const ogpMap: OGPDataMap = {};
const linkPromises: Promise<void>[] = [];

console.log(`[DEBUG: LINKS FOUND] Total links to process: ${links.length}`);

links.each((index, element) => {
 const $a = $(element);
 const originalHref = $a.attr('href');

 linkPromises.push((async () => {
 if (!originalHref || !originalHref.startsWith('http')) {
  return;
 }

 try {
  const url = new URL(originalHref);
  const domain = url.hostname;

  // 既にアフィリエイトリンクであればスキップ（OGP取得は行う）
  if (domain === AFFILIATE_DOMAIN) {
  return;
  }
  
  // ★修正 1: オリジナル URL をカスタム属性に保存 (キーの不一致回避) ★
  $a.attr('data-original-href', originalHref); 

  // 1. OGPデータの取得 (ダイレクトリンクを使用)
  const ogpData = await fetchOGPData(originalHref);

  // 2. OGPデータが取得できた場合のみアフィリエイト変換を試みる
  if (ogpData) {
  // アフィリエイト変換処理
  const merchantData = await resolveMerchantId(domain);

  if (merchantData && merchantData.merchant_id) {
   const affiliateUrl = generateAffiliateUrl(
   originalHref,
   merchantData.merchant_id
   );
   
   // LinkCardに渡すOGPデータ内のリンクをアフィリエイトURLに上書き
   ogpData.siteUrl = affiliateUrl;
   
   // HTML内の<a>タグもアフィリエイトURLに置き換え
   $a.attr('href', affiliateUrl);
   $a.attr('target', '_blank');
   $a.attr('rel', 'nofollow noopener noreferrer');
   $a.removeAttr('automate_uuid');
   
   console.log(`[AFFILIATE CONVERSION SUCCESS] ${domain}`);
  }

  // OGPデータをマップに追加 (キーはオリジナルURL)
  ogpMap[originalHref] = ogpData;
  }

 } catch (e) {
  console.error(`[ERROR: LINK PROCESS FAILED] Link: ${originalHref}`, e);
 }
 })());
});

await Promise.all(linkPromises);

// 修正後のHTMLとOGPマップを返す
return { processedHtml: $.html(), ogpMap };
}


/**
* 動的なメタデータを生成 (Static Generation)
*/
export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {

const { slug } = await params;

const post = await getPostBySlug(slug);

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
// 開発サーバーのタイムアウトを避けるため、記事数を 100 から 20 に減らしました。
const posts = await getPosts(20); // ★ 修正済み ★

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

const { slug } = await params;

// データ取得
const post = await getPostBySlug(slug);
const imageUrl = post ? getFeaturedImageUrl(post) : null;

if (!post) {
 // 記事が見つからなかった場合は Next.js の 404 ページを表示
 notFound();
}

// post.content.rendered が存在しない場合は空文字列を使用
const rawContent = post.content?.rendered || "";

// ★★★ リンク変換とOGPデータ取得を実行 ★★★
const { processedHtml, ogpMap } = await processPostContent(rawContent);
console.log(`[OGP MAP KEYS] Found ${Object.keys(ogpMap).length} URLs with OGP data.`);
// ★★★ ---------------------------------- ★★★


// ★★★ HTMLパース時の要素置換ロジックを定義 ★★★
const replaceLinkWithCard = (node: DOMNode) => {
 if (node instanceof Element && node.name === 'a' && node.attribs.href) {
 
 // ★修正 2: オリジナルURLまたは現在のhrefをキーとして使用し、ogpMapを検索 ★
 // data-original-href属性があればそれを使う。なければ現在のhref (アフィリエイト化済み) を使う。
 const keyHref = node.attribs['data-original-href'] || node.attribs.href;
 const ogpData = ogpMap[keyHref]; 
 // ★---------------------------------------------------------------------- ★


 // ★修正 3: OGPデータが存在すれば、リンクタグの中身に関わらずLinkCardに置き換える ★
 if (ogpData) {
  return <LinkCard data={ogpData} />;
 }
 
 // OGPデータがない場合は、通常のリンクとして扱う
 return null; 
 }
 // 他の要素はそのまま
 return null; 
};

// 変換されたHTMLをReact要素にパース
const parsedContent = parse(processedHtml, { replace: replaceLinkWithCard });
// ★★★ ----------------------------------------- ★★★


return (
 <main className={styles.postDetailMain}>

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
   sizes="(max-width: 768px) 100vw, 800px"
   style={{ width: '100%', height: 'auto' }}
   priority
  />
  </div>
 )}

 
 <div className={styles.postContent}>
  {/* 修正: dangerouslySetInnerHTML を parse されたコンテンツに置き換え */}
  {parsedContent}
 </div>
 

 <Link href="/sale-blog" className={styles.backLinkBottom}>
  &larr; 一覧に戻る
 </Link>
 </main>
);
}