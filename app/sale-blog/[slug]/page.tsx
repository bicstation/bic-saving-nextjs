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
import { resolveMerchantId } from "@/lib/api"; // ★ APIラッパーを追加 ★
// --- (インポート) HTML解析ライブラリ ---
import * as cheerio from 'cheerio';

// ISR の設定: 1時間 (3600秒) ごとにバックグラウンドで再生成
export const revalidate = 3600;

// PostDetailPageコンポーネントで使う型定義を再配置
interface PostDetailPageProps {
    params: { slug: string };
}

// L-Share/Rakuten Marketing のアフィリエイトドメインを定義
const AFFILIATE_DOMAIN = 'click.linksynergy.com';

/**
 * 記事のHTMLコンテンツ内のリンクをアフィリエイトリンクに非同期で変換する関数
 * @param htmlContent - WordPressから取得した生のHTMLコンテンツ
 * @returns 変換後のHTMLコンテンツ (Promise)
 */
async function processContentForAffiliateLinks(htmlContent: string): Promise<string> {

    // 1. cheerioでHTMLをロード
    const $ = cheerio.load(htmlContent, null, false);

    // 2. 記事内のすべての <a> タグを抽出
    const links = $('a');

    // ★★★ デバッグ用のログ出力追加 ★★★
    console.log(`[DEBUG: LINKS FOUND] Total links: ${links.length}`);
    links.each((index, element) => {
        const $a = $(element);
        const originalHref = $a.attr('href');
        console.log(`[DEBUG: LINK ${index + 1}] Original HREF: ${originalHref || 'N/A'}`);
    });
    console.log(`[DEBUG: END LINKS FOUND]`);
    // ★★★ デバッグ用のログ出力ここまで ★★★

    // 3. 各リンクの非同期置換処理を格納する配列
    const linkPromises: Promise<void>[] = [];

    links.each((index, element) => {
        const $a = $(element);
        const originalHref = $a.attr('href');

        // 即時実行関数で非同期処理を作成し、Promiseを配列に追加
        linkPromises.push((async () => {
            if (!originalHref || !originalHref.startsWith('http')) {
                return; // hrefがない、または外部リンクでない場合はスキップ
            }

            try {
                // 3-1. ドメイン名を取得
                const url = new URL(originalHref);
                const domain = url.hostname;

                // ★★★ 修正: 既にアフィリエイトリンクであればスキップ ★★★
                if (domain === AFFILIATE_DOMAIN) {
                    // console.log(`Skipping already processed affiliate link: ${originalHref}`);
                    return;
                }

                // 3-2. バックエンドAPIを呼び出し、MIDを取得
                const merchantData = await resolveMerchantId(domain);

                // ★★★ 修正箇所: merchantData の中身を詳細にログ出力する ★★★
                if (merchantData) {
                    console.log("✅ Merchant Data Received:", merchantData);
                } else {
                    console.log("❌ Merchant Data Not Found (resolveMerchantId returned null).");
                }
                // ★★★ 修正箇所ここまで ★★★

                console.log(`[DEBUG: API RETURNED] Domain: ${domain}, MID: ${merchantData?.merchant_id}`);

                if (merchantData && merchantData.merchant_id) {
                    // 3-3. アフィリエイトリンクを生成
                    const affiliateUrl = generateAffiliateUrl(
                        originalHref,
                        merchantData.merchant_id
                    );

                    // ★★★ デバッグ用のログ出力追加 ★★★
                    // このログがサーバーコンソールに出力されれば変換成功が確認できます
                    console.log(`[AFFILIATE CONVERSION SUCCESS]`);
                    console.log(`  Source URL: ${originalHref}`);
                    console.log(`  Merchant ID: ${merchantData.merchant_id}`);
                    console.log(`  Affiliate URL: ${affiliateUrl}`);
                    // ★★★ デバッグ用のログ出力ここまで ★★★

                    // 3-4. href属性をアフィリエイトURLに置き換え
                    $a.attr('href', affiliateUrl);

                    // 3-5. アフィリエイトリンクに必要な属性を追加
                    $a.attr('target', '_blank');
                    $a.attr('rel', 'nofollow noopener noreferrer');

                    // ★★★ WordPressの残留属性を強制的に削除する修正を追加 ★★★
                    $a.removeAttr('automate_uuid');
                    $a.removeAttr('target');
                    $a.attr('target', '_blank'); // 正しい値に再設定
                }

            } catch (e) {
                // APIエラーが発生した場合でも、元のリンクを維持
                // console.error(`Failed to process link ${originalHref}:`, e);
                // console.error(`[ERROR: LINK PROCESS FAILED] Link: ${originalHref}`, e);
            }
        })());
    });

    // 4. すべてのリンク置換処理が完了するのを待つ
    await Promise.all(linkPromises);

    // 5. 修正後のHTMLを文字列として返す
    return $.html();
}


/**
* 動的なメタデータを生成 (Static Generation)
*/
export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {

    // ★修正: paramsオブジェクト全体をawaitしてslugを取得する★
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

    // ★修正: paramsオブジェクト全体をawaitしてslugを取得する★
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

    // ★★★ リンク変換ロジックを適用 (awaitで非同期処理を待つ) ★★★
    const processedContent = await processContentForAffiliateLinks(rawContent);


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
                {/* ★★★ 変換済みのコンテンツをレンダリング ★★★ */}
                <div dangerouslySetInnerHTML={{ __html: processedContent }} />
            </div>

            <Link href="/sale-blog" className={styles.backLinkBottom}>
                &larr; 一覧に戻る
            </Link>
        </main>
    );
}