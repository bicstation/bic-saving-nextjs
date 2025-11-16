// /lib/link-processor.ts
import * as cheerio from 'cheerio';
import { fetchLinkShareTextLinks, LinkShareLink, DELL_MID } from './api';

// Next.jsの環境では、ランディングページURLのドメイン名として
// "www.dell.com" または "dell.com" を使用します。
const DELL_LANDING_DOMAIN = 'dell.com';

/**
 * HTMLコンテンツ内のデル製品のランディングURLを、
 * LinkShare APIから取得したアフィリエイトURLに置換し、カード表示用のHTMLに変換します。
 * * @param content 処理対象のHTML文字列 (WordPressの投稿内容)
 * @returns 変換後のHTML文字列
 */
export async function processAffiliateLinks(content: string): Promise<string> {
    
    // 1. LinkShare APIからデルの全てのテキストリンクを取得
    // 取得に失敗した場合も、空の配列が返るため、処理は継続します。
    const dellLinks: LinkShareLink[] = await fetchLinkShareTextLinks(DELL_MID);

    if (dellLinks.length === 0) {
        console.warn(`[Link Processor] LinkShare APIからデルのリンクが取得できませんでした (MID: ${DELL_MID})。リンク変換をスキップします。`);
        return content;
    }

    // 2. cheerioでHTMLコンテンツをパース
    const $ = cheerio.load(content);
    
    let linksReplacedCount = 0;

    // 3. すべての <a> タグを走査し、デルのランディングURLに一致するか確認
    $('a').each((i, element) => {
        const $link = $(element);
        const linkUrl = $link.attr('href');

        if (!linkUrl) {
            return; // href属性がない場合はスキップ
        }

        try {
            const url = new URL(linkUrl);
            // デルのランディングページドメインかどうかをチェック
            if (url.hostname === DELL_LANDING_DOMAIN || url.hostname === `www.${DELL_LANDING_DOMAIN}`) {
                
                // 4. APIデータとのマッチング
                // trim()でURLの末尾の空白などを除去し、大文字/小文字を無視して比較するためにtoLowerCase()を使用
                const matchedLink = dellLinks.find(apiLink => 
                    apiLink.landURL.trim().toLowerCase() === linkUrl.trim().toLowerCase()
                );

                if (matchedLink) {
                    linksReplacedCount++;
                    
                    // 5. マッチした場合、アフィリエイトカード用のHTMLコメント/プレースホルダーに置換
                    // Next.jsのサーバーコンポーネントで、このコメントを検知して
                    // <AffiliateCard> コンポーネントに変換することを想定します。
                    const cardHtml = `
<div class="affiliate-card-placeholder" 
    data-mid="${matchedLink.mid}" 
    data-clickurl="${matchedLink.clickURL}"
    data-landurl="${matchedLink.landURL}"
    data-title="${matchedLink.linkName}"
    data-vendor="Dell">
    </div>`;

                    // <a> タグをプレースホルダーに置き換え
                    $link.replaceWith(cardHtml);

                } else {
                    // デルのドメインだが、APIデータに一致する landURL が見つからなかった場合
                    console.warn(`[Link Processor] 記事内のデルのURLが見つかりませんでしたが、LinkShare APIデータと一致しませんでした: ${linkUrl}`);
                }
            }
        } catch (e) {
            // URLパースエラー（無効なURL）は無視
            // console.error(`[Link Processor] 無効なURLを無視: ${linkUrl}`);
            return;
        }
    });

    console.log(`[Link Processor] 処理完了。デルのリンク ${linksReplacedCount} 件をアフィリエイトカードに変換しました。`);

    // 6. 変換後のHTML文字列を返す
    return $.html();
}