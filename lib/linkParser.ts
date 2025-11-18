// /lib/linkParser.ts (修正完了版: TLS回避は環境変数に依存)

import * as cheerio from 'cheerio';
// import axios from 'axios'; // 削除済み
import * as iconv from 'iconv-lite';
// import { Agent as HttpsAgent } from 'https'; // ★削除: fetchのagentオプション非対応のため★

interface OGPData {
    title: string | null;
    description: string | null;
    imageUrl: string | null;
    siteUrl: string;
    faviconUrl: string | null;
}

// ★★★ 削除: httpsAgentの定義と作成は削除（環境変数で代替） ★★★

/**
 * バイナリデータからHTMLのエンコーディングを検出し、文字列にデコードする
 * @param buffer - 取得したレスポンスのバイナリデータ
 * @returns デコードされたHTML文字列
 */
function decodeHtml(buffer: Buffer): string {
    // 1. まずは UTF-8 でデコードを試みる
    let html = iconv.decode(buffer, 'utf8');

    // 2. HTMLの<meta>タグからcharsetを取得する
    const $ = cheerio.load(html);
    const contentType = $('meta[http-equiv="Content-Type"]').attr('content');
    const charsetMeta = $('meta[charset]').attr('charset');

    let detectedCharset = null;

    if (charsetMeta) {
        detectedCharset = charsetMeta.toLowerCase();
    } else if (contentType && contentType.includes('charset=')) {
        detectedCharset = contentType.split('charset=')[1].trim().toLowerCase();
    }
    
    // 3. 検出されたcharsetがUTF-8以外であれば、正しいcharsetでデコードし直す
    if (detectedCharset && detectedCharset !== 'utf-8' && iconv.encodingExists(detectedCharset)) {
        // Shift_JISやEUC-JPなどの場合は、再度正しいエンコーディングでデコード
        html = iconv.decode(buffer, detectedCharset);
        console.log(`[DEBUG: ENCODING] Detected and decoded with: ${detectedCharset}`);
    } else {
        console.log(`[DEBUG: ENCODING] Defaulting to UTF-8.`);
    }

    return html;
}


export async function fetchOGPData(url: string): Promise<OGPData | null> {
    const siteUrl = new URL(url).origin;
    let html: string;

    try {
        // ★修正 1: fetch API を使用してリクエストを送信 ★
        // TLS検証無効化は、起動時の環境変数 NODE_TLS_REJECT_UNAUTHORIZED=0 に依存
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Bic-Saving Link Preview Bot',
            },
            // Next.jsのSSGビルド時に再生成を制御
            next: { revalidate: 3600 }, 
            // ★★★ 修正 2: agentオプションは削除し、エラーを解消 ★★★
        });
        
        if (!response.ok) {
            console.error(`Failed to fetch URL: ${url}. Status: ${response.status}`);
            return null;
        }

        // ★修正 3: レスポンスをArrayBufferとして取得（バイナリデータ） ★
        const arrayBuffer = await response.arrayBuffer(); 

        // ★修正 4: ArrayBufferをBufferに変換し、文字コード検出ロジックでデコード ★
        const buffer = Buffer.from(arrayBuffer);
        html = decodeHtml(buffer);

        const $ = cheerio.load(html);

        // OGP情報を抽出
        const title = $('meta[property="og:title"]').attr('content') || $('title').text() || null;
        const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || null;
        const imageUrl = $('meta[property="og:image"]').attr('content') || null;

        // ★--- ファビコンURLを抽出 ---★
        let faviconUrl: string | null = null;
        
        // 1. link rel="icon" や link rel="shortcut icon" などを探す
        const iconLink = $('link[rel*="icon"]').first(); 
        if (iconLink.length) {
            let iconHref = iconLink.attr('href');
            if (iconHref) {
                // 相対パスの場合、絶対パスに変換する
                faviconUrl = new URL(iconHref, siteUrl).href;
            }
        }
        
        // 2. 見つからなかった場合、デフォルトの favicon.ico を試す
        if (!faviconUrl) {
            // 多くのサイトで /favicon.ico に配置されているため、フォールバックとして試す
            faviconUrl = `${siteUrl}/favicon.ico`;
        }
        // ★--------------------------------------★

        return {
            title,
            description,
            imageUrl,
            siteUrl,
            faviconUrl,
        };
    } catch (error) {
        console.error(`Error parsing OGP data for ${url}:`, error);
        return null;
    }
}