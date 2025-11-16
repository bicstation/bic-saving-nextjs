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
import { resolveMerchantId, fetchLinkShareTextLinks, DELL_MID } from "@/lib/api"; // DELL_MIDとfetchLinkShareTextLinksを追加
// --- (インポート) HTML解析ライブラリ ---
import * as cheerio from 'cheerio';

// ★★★ リッチリンクカード機能のための追加インポート ★★★
import { fetchOGPData } from "@/lib/linkParser"; // OGP/ファビコン取得関数
import LinkCard from '../../components/LinkCard'; // リンクカードコンポーネント
import parse, { DOMNode, Element } from 'html-react-parser'; // HTMLパースライブラリ
import { AffiliateCard } from "@/components/AffiliateCard"; // デルカードコンポーネントを追加
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
const DELL_LANDING_DOMAIN = 'dell.com'; // デルのランディングドメイン

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

    // --- デル特有のAPIデータを事前に取得 (ステップ 1) ---
    const dellLinks = await fetchLinkShareTextLinks(DELL_MID);
    const dellLinksMap = new Map(dellLinks.map(link => [link.landURL.trim().toLowerCase(), link]));
    
    if (dellLinks.length === 0) {
        console.warn(`[Link Processor] LinkShare APIからデルのリンクが取得できませんでした (MID: ${DELL_MID})。デル特有のリンク変換をスキップします。`);
    }
    // -----------------------------------------------------

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
                const normalizedOriginalHref = originalHref.trim().toLowerCase();

                // 既にアフィリエイトリンクであればスキップ（OGP取得は行う）
                if (domain === AFFILIATE_DOMAIN) {
                    // OGPデータの取得 (アフィリエイトリンクを使用)
                    const ogpData = await fetchOGPData(originalHref);
                    if (ogpData) {
                        ogpMap[originalHref] = ogpData;
                    }
                    return;
                }
                
                // ★デル特有のリンク変換 (ステップ 2: processAffiliateLinksのロジックを統合) ★
                if (domain === DELL_LANDING_DOMAIN || domain === `www.${DELL_LANDING_DOMAIN}`) {
                    const matchedLink = dellLinksMap.get(normalizedOriginalHref);
                    
                    if (matchedLink) {
                        // デルのランディングURLが見つかった場合
                        $a.attr('data-vendor', 'dell');
                        $a.attr('data-clickurl', matchedLink.clickURL);
                        $a.attr('data-title', matchedLink.linkName);
                        // HTML内の<a>タグもアフィリエイトURLに置き換え
                        $a.attr('href', matchedLink.clickURL);
                        $a.attr('target', '_blank');
                        $a.attr('rel', 'nofollow noopener noreferrer');
                        $a.removeAttr('automate_uuid');
                        
                        console.log(`[DELL CONVERSION SUCCESS] ${matchedLink.linkName}`);
                    }
                }
                // ----------------------------------------------------------------------
                
                // 汎用的なアフィリエイト変換とOGP取得
                
                // オリジナル URL をカスタム属性に保存 (LinkCardのキーに使用) 
                // デルの変換で既にhrefが変わっていても、OGPマップのキーとしてオリジナルが必要なため
                $a.attr('data-original-href', originalHref); 

                // 1. OGPデータの取得 (ダイレクトリンクを使用)
                const ogpData = await fetchOGPData(originalHref);

                // 2. OGPデータが取得できた場合のみアフィリエイト変換を試みる
                if (ogpData) {
                    // デル特有の変換がされていなければ、汎用的な変換を試みる
                    if (!$a.attr('data-vendor')) {
                        const merchantData = await resolveMerchantId(domain);

                        if (merchantData && merchantData.merchant_id) {
                            const affiliateUrl = generateAffiliateUrl(
                                originalHref,
                                merchantData.merchant_id
                            );
                            
                            // LinkCardに渡すOGPデータ内のリンクをアフィリエイトURLに上書き
                            ogpData.siteUrl = affiliateUrl;
                            
                            // HTML内の<a>タグもアフィリエイトURLに置き換え (デル変換済みならスキップ)
                            $a.attr('href', affiliateUrl);
                            $a.attr('target', '_blank');
                            $a.attr('rel', 'nofollow noopener noreferrer');
                            $a.removeAttr('automate_uuid');
                            
                            console.log(`[AFFILIATE CONVERSION SUCCESS] ${domain}`);
                        }
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
    const posts = await getPosts(20); // ★ 記事数を 20 に制限 ★

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
    // デル特有の変換は、この関数内部で実行されます。
    const { processedHtml, ogpMap } = await processPostContent(rawContent);
    console.log(`[OGP MAP KEYS] Found ${Object.keys(ogpMap).length} URLs with OGP data.`);
    // ★★★ ---------------------------------- ★★★


    // ★★★ HTMLパース時の要素置換ロジックを定義 ★★★
    const replaceLinkWithCard = (node: DOMNode) => {
        if (node instanceof Element && node.name === 'a' && node.attribs.href) {
            
            const attribs = node.attribs;
            const keyHref = attribs['data-original-href'] || attribs.href;
            const ogpData = ogpMap[keyHref]; 
            
            // 1. デル特有のリンクカードに置換するかチェック (data-vendor属性を確認)
            if (attribs['data-vendor'] === 'dell' && attribs['data-clickurl']) {
                // デルのリンクとしてカスタム属性が付与されている場合、AffiliateCardに置換
                return (
                    <AffiliateCard
                        clickUrl={attribs['data-clickurl']}
                        landUrl={attribs['data-original-href'] || attribs.href}
                        title={attribs['data-title'] || 'Dell 製品'}
                        vendor="Dell"
                    />
                );
            }
            
            // 2. 汎用的なOGPリンクカードに置換するかチェック
            if (ogpData) {
                // OGPデータが存在すれば、LinkCardに置き換える
                return <LinkCard data={ogpData} />;
            }
            
            // 3. デルのリンクでもなく、OGPデータもない場合は、通常のリンクタグとしてそのまま表示 (nullを返す)
            return null; 
        }
        // 他の要素はそのまま (nullを返すことで、parse関数がデフォルトの処理を行う)
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
                {/* 変換されたReact要素を表示 */}
                {parsedContent}
            </div>
            

            <Link href="/sale-blog" className={styles.backLinkBottom}>
                &larr; 一覧に戻る
            </Link>
        </main>
    );
}