// /app/sale-blog/[slug]/page.tsx

import { getPostBySlug, getFeaturedImageUrl, getPosts } from "@/lib/wordpress";
import { notFound } from "next/navigation";
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import styles from './post-detail.module.css';

import { generateAffiliateUrl } from "@/lib/affiliate";
import { resolveMerchantId } from "@/lib/api"; 
import * as cheerio from 'cheerio';

import parse from 'html-react-parser'; 

import { AffiliateCard } from "@/components/AffiliateCard";

import { fetchOGPData } from "@/lib/linkParser"; 
import LinkCard from '../../components/LinkCard'; 

// OGPDataの型定義
interface OGPData {
title: string | null;
description: string | null;
imageUrl: string | null;
siteUrl: string; // 最終的なリンク先 (記事URL)
faviconUrl: string | null;
}

// ISR の設定: 1時間 (3600秒) ごとにバックグラウンドで再生成
export const revalidate = 3600;

interface PostDetailPageProps {
params: { slug: string };
}

const AFFILIATE_DOMAIN = 'click.linksynergy.com';
const DELL_LANDING_DOMAIN = 'dell.com';

/**
* 記事のHTMLコンテンツを処理し、アフィリエイトリンク変換と残留ブログカードの除去、
* ★インラインカードURLの抽出★を行う
*/
async function processPostContent(htmlContent: string): Promise<{ processedHtml: string, inlineCardUrls: string[] }> {
const $ = cheerio.load(htmlContent, null, false);
const links = $('a');
const linkPromises: Promise<void>[] = [];
const inlineCardUrls: string[] = []; // ★追加: 抽出されたインラインカードのURLを格納

console.log(`[DEBUG: LINKS FOUND] Total links to process: ${links.length}`);

// Cocoonテーマのブログカード残留HTMLを削除
$('.rt-card').remove();
$('.rt-card-link').remove(); 
console.log(`[CLEANUP] Removed elements with class .rt-card and .rt-card-link.`);

 // ★修正: インラインカードのプレースホルダーからURLを抽出するロジック
 $('div[data-link-card-placeholder]').each((index, element) => {
  const originalHrefAttr = $(element).attr('data-original-href');
  
  // ★修正適用: 属性値が 'URL' の場合に対応するため、正規表現にマッチしなくても属性値全体をURLとする
  const urlMatch = originalHrefAttr ? originalHrefAttr.match(/href="?(.*?)"?$/) : null; 
  const originalUrl = urlMatch ? urlMatch[1] : originalHrefAttr; // ★変更点: マッチしなければ originalHrefAttr を使用

  if (originalUrl) {
   inlineCardUrls.push(originalUrl);
  }
 });

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
  
  if (domain === AFFILIATE_DOMAIN) {
  return;
  }
  
  const merchantData = await resolveMerchantId(domain);
  
  if (merchantData && merchantData.merchant_id) {
  const affiliateUrl = generateAffiliateUrl(
   originalHref,
   merchantData.merchant_id
  );
  
  $a.attr('href', affiliateUrl);
  $a.attr('target', '_blank');
  $a.attr('rel', 'nofollow noreferrer');

  console.log(`[AFFILIATE CONVERSION SUCCESS] ${domain}`);
  }
 } catch (e) {
  console.error(`[ERROR: LINK PROCESS FAILED] Link: ${originalHref}`, e);
 }
 })());
});

await Promise.all(linkPromises);

return { processedHtml: $.html(), inlineCardUrls }; // ★修正: 抽出したURLリストを返す
}

/**
* 記事のパーマリンクを基にOGPデータを取得する
*/
async function getCardDataForPost(postUrl: string): Promise<OGPData | null> {
try {
 // 1. OGPデータを取得
 const ogpData = await fetchOGPData(postUrl);

 if (!ogpData) {
 console.log(`[CardData] OGP data not found for: ${postUrl}`);
 return null;
 }
 
 // 2. OGPデータ取得元のURLをアフィリエイト変換する
 try {
  const url = new URL(postUrl);
  const domain = url.hostname;
  
  // アフィリエイトドメイン自体であれば変換スキップ
  if (domain !== AFFILIATE_DOMAIN) { 
   const merchantData = await resolveMerchantId(domain);
   
   if (merchantData && merchantData.merchant_id) {
    // 変換成功
    postUrl = generateAffiliateUrl(
     postUrl,
     merchantData.merchant_id
    );
    console.log(`[AFFILIATE CONVERSION IN OGP] Success for: ${domain}`);
   }
  }
 } catch (conversionError) {
  console.error(`[ERROR: OGP Link Conversion Failed] Link: ${postUrl}`, conversionError);
  // 変換失敗時は元の postUrl を使用
 }

 ogpData.siteUrl = postUrl; // 変換されたURL（または元のURL）を格納

 return ogpData;

} catch (e) {
 console.error(`[ERROR: getCardDataForPost] Failed to process link: ${postUrl}`, e);
 return null;
}
}

// --- メタデータ/StaticParams生成関数は省略 (変更なし) ---
export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {
 // ... 省略 ...
 return {};
}

export async function generateStaticParams() {
 // ... 省略 ...
 return [];
}


// --- PostDetailPage コンポーネント (レンダリング) ---

export default async function PostDetailPage({ params }: PostDetailPageProps) {

const { slug } = await params;
const post = await getPostBySlug(slug);
const imageUrl = post ? getFeaturedImageUrl(post) : null;

if (!post) {
 notFound();
}

const rawContent = post.content?.rendered || "";

// ★修正: 処理結果から processedHtml と inlineCardUrls の両方を受け取る
const { processedHtml, inlineCardUrls } = await processPostContent(rawContent);

 // ★★★ 修正: 記事内の全インラインカードのOGPデータを事前に取得するロジック ★★★
 const uniquePlaceholderUrls = [...new Set(inlineCardUrls)];

 const ogpDataPromises = uniquePlaceholderUrls.map(async (url) => {
  try {
   // ★修正: API/OGP取得エラー時もPromise.allが中断しないように try-catch でラップ
   const fetchedCardData = await getCardDataForPost(url);
   return { url, data: fetchedCardData };
  } catch (e) {
   console.error(`[CRITICAL] Failed to process URL in Promise.all: ${url}`, e);
   return { url, data: null };
  }
 });

 const results = await Promise.all(ogpDataPromises);

 // OGPデータ取得結果をMapに格納 (高速参照用)
 const inlineCardDataMap = new Map<string, OGPData | null>();
 results.forEach(result => {
  inlineCardDataMap.set(result.url, result.data);
 });
 // ★★★ ---------------------------------------------------------------------- ★★★


// ★★★ 記事末尾に表示する関連ブログカードの取得ロジック (変更なし) ★★★
const relatedPosts = (await getPosts(5))
 .filter(p => p.slug !== slug);

const displayPosts = relatedPosts.slice(0, 4); 

const relatedCardDataPromises = displayPosts.map(async (p) => {
 const postUrl = `https://www.bic-saving.com/sale-blog/${p.slug}`;
 const cardData = await getCardDataForPost(postUrl); 
 
 if (cardData) {
 return { id: p.id, cardData };
 } else {
 const fallbackCardData: OGPData = {
  title: p.title.rendered.replace(/<[^>]*>/g, ''),
  description: p.excerpt?.rendered.replace(/<[^>]*>/g, '') || '関連情報',
  imageUrl: getFeaturedImageUrl(p), 
  siteUrl: postUrl,
  faviconUrl: null,
 };
 return { id: p.id, cardData: fallbackCardData };
 }
});

const relatedCardData = (await Promise.all(relatedCardDataPromises))
 .filter((p): p is { id: number, cardData: OGPData } => p !== null); 
// ★★★ ------------------------------------------------------------- ★★★

// ★★★ 記事コンテンツの HTML 文字列を React 要素に変換するロジック (同期化) ★★★
const reactContent = parse(processedHtml, { // ★修正: await を削除
 replace: (domNode) => { // ★修正: replace を同期関数に戻す
 
 if (domNode.type === 'tag' && domNode.attribs && domNode.attribs['data-link-card-placeholder'] !== undefined) {
  
  const originalHrefAttr = domNode.attribs['data-original-href'];
  // ★修正適用: processPostContentで使ったロジックと同じものを適用
  const urlMatch = originalHrefAttr ? originalHrefAttr.match(/href="?(.*?)"?$/) : null; 
  const originalUrl = urlMatch ? urlMatch[1] : originalHrefAttr; // ★変更点: マッチしなければ originalHrefAttr を使用


  if (originalUrl) {
  // ★修正: 事前に取得したMapからデータを参照する (awaitなし)
  const fetchedCardData = inlineCardDataMap.get(originalUrl);
  
  // 取得失敗時のフォールバックデータ
  const fallbackCardData: OGPData = {
   title: originalUrl || 'リンク情報', // originalUrlがnullになることはないが念のため
   description: 'リンク先の情報',
   imageUrl: null,
   siteUrl: originalUrl || '#',
   faviconUrl: null,
  };
  
  // 変換後のsiteUrlを含む cardDataToRender を LinkCard に渡す
  const cardDataToRender = fetchedCardData || fallbackCardData;
  
  return (
   <div key={originalUrl} style={{ margin: '1em 0' }}>
   <LinkCard 
    data={cardDataToRender} 
    linkType="external" 
   />
   </div>
  );
  }
  
  return domNode; 
 }
 
 return domNode;
 }
});
// ★★★ ------------------------------------------------------------- ★★★


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
  {reactContent} 
 </div>


 {relatedCardData.length > 0 && (
  <div className={styles.relatedCardsSection}>
  <h2>📢 最新のセール情報</h2>
  <div className={styles.cardGrid}>
   {relatedCardData.map((data) => (
   <LinkCard 
    key={data.id} 
    data={data.cardData} 
    linkType="internal" 
   />
   ))}
  </div>
  </div>
 )}


 <Link href="/sale-blog" className={styles.backLinkBottom}>
  &larr; 一覧に戻る
 </Link>
 </main>
);
}