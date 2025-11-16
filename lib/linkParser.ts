// /lib/linkParser.ts (修正版)

import * as cheerio from 'cheerio';
// ★追加: 文字コードの処理のためにaxiosとiconv-liteをインポート
import axios from 'axios';
import * as iconv from 'iconv-lite'; 

interface OGPData {
 title: string | null;
 description: string | null;
 imageUrl: string | null;
 siteUrl: string;
 // ★--- ファビコンURLを追加 ---★
 faviconUrl: string | null; 
}

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
  // ★修正 1: axiosを使用してバイナリデータ (arraybuffer) として取得 ★
  const response = await axios.get(url, {
   responseType: 'arraybuffer', // バイナリで取得
   headers: {
    'User-Agent': 'Bic-Saving Link Preview Bot',
   },
      // キャッシュを無効化
   transformResponse: [(data) => data], // axiosにデコードさせず、バイナリのままにする
  });
    
    if (response.status !== 200) {
        console.error(`Failed to fetch URL: ${url}. Status: ${response.status}`);
        return null;
    }

    // ★修正 2: 取得したバイナリデータを文字コード検出ロジックでデコード ★
    const buffer = Buffer.from(response.data as ArrayBuffer);
    html = decodeHtml(buffer);

  const $ = cheerio.load(html);

  // OGP情報を抽出
  // 文字化けが解消されていれば、これらの値は正しくなる
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
   faviconUrl, // ★追加
  };
 } catch (error) {
  console.error(`Error parsing OGP data for ${url}:`, error);
  return null;
 }
}