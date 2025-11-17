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
 * 記事のHTMLコンテンツを処理し、アフィリエイトリンク変換と残留ブログカードの除去を行う
 */
async function processPostContent(htmlContent: string): Promise<{ processedHtml: string }> {
    const $ = cheerio.load(htmlContent, null, false);
    const links = $('a');
    const linkPromises: Promise<void>[] = [];

    console.log(`[DEBUG: LINKS FOUND] Total links to process: ${links.length}`);

    // Cocoonテーマのブログカード残留HTMLを削除
    $('.rt-card').remove();
    $('.rt-card-link').remove(); 
    console.log(`[CLEANUP] Removed elements with class .rt-card and .rt-card-link.`);


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

    return { processedHtml: $.html() };
}

/**
 * 記事のパーマリンクを基にOGPデータを取得する
 */
async function getCardDataForPost(postUrl: string): Promise<OGPData | null> {
    try {
        const ogpData = await fetchOGPData(postUrl);

        if (!ogpData) {
            console.log(`[CardData] OGP data not found for: ${postUrl}`);
            return null;
        }

        ogpData.siteUrl = postUrl;

        return ogpData;

    } catch (e) {
        console.error(`[ERROR: getCardDataForPost] Failed to process link: ${postUrl}`, e);
        return null;
    }
}

// --- メタデータ生成関数、StaticParams生成関数は省略 (変更なし) ---
export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) return {};

    const descriptionHtml = post.excerpt?.rendered || post.content?.rendered;
    let description = descriptionHtml ? descriptionHtml.replace(/<[^>]*>/g, '').substring(0, 160) : 'セール情報詳細ページです。';
    const imageUrl = getFeaturedImageUrl(post);
    const postUrl = `https://www.bic-saving.com/sale-blog/${post.slug}`;

    return {
        title: `${post.title.rendered.replace(/<[^>]*>/g, '') || "記事タイトルなし"} | bic-saving セール情報`,
        description: description,
        alternates: { canonical: postUrl },
        openGraph: {
            title: post.title.rendered.replace(/<[^>]*>/g, ''),
            description: description,
            url: postUrl,
            type: 'article',
            images: imageUrl ? [{ url: imageUrl }] : undefined,
        },
    };
}

export async function generateStaticParams() {
    const posts = await getPosts(20);
    if (!Array.isArray(posts)) return [];
    
    return posts
        .filter(post => post && typeof post.slug === 'string' && post.slug.length > 0)
        .map(post => ({ slug: post.slug }));
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

    const { processedHtml } = await processPostContent(rawContent);


    // ★★★ 記事末尾に表示する関連ブログカードの取得ロジック (フォールバック強化済み) ★★★
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
    
    // ★★★ 記事コンテンツの HTML 文字列を React 要素に変換するロジック (修正) ★★★
    const reactContent = await parse(processedHtml, { // ★修正: parse に await を追加
        replace: async (domNode) => { // ★修正: replace を async に変更
            
            if (domNode.type === 'tag' && domNode.attribs && domNode.attribs['data-link-card-placeholder'] !== undefined) {
                
                const originalHrefAttr = domNode.attribs['data-original-href'];
                const urlMatch = originalHrefAttr ? originalHrefAttr.match(/href='(.*?)'/) : null; 
                const originalUrl = urlMatch ? urlMatch[1] : null;

                if (originalUrl) {
                    // ★★★ ここが記事途中のURLをブログカードに変換するロジック ★★★
                    const fetchedCardData = await getCardDataForPost(originalUrl);
                    
                    const fallbackCardData: OGPData = {
                        title: originalUrl, 
                        description: 'リンク先の情報',
                        imageUrl: null,
                        siteUrl: originalUrl,
                        faviconUrl: null,
                    };
                    
                    const cardDataToRender = fetchedCardData || fallbackCardData;
                    // ★★★ ------------------------------------------------------- ★★★
                    
                    return (
                        <div key={originalUrl} style={{ margin: '1em 0' }}>
                            <LinkCard 
                                data={cardDataToRender} 
                                linkType="external" 
                            />
                        </div>
                    );
                }
                
                return <></>; 
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