// /app/rss.xml/route.ts

import { getProducts } from '@/lib/data'; // 既存の商品取得関数をインポート
import { NextResponse } from 'next/server';
import { Product } from '@/types/index';

// ★★★ 定数: 環境に合わせて修正してください ★★★
const BASE_URL = 'https://your-production-domain.com'; 
const SITE_TITLE = 'Bic Saving Next.js ECサイト';
const SITE_DESCRIPTION = 'Bic Saving APIを利用した最新の商品情報フィード';
const FEED_LIMIT = 30; // フィードに含める最新の商品数
// ★★★ ---------------------------------- ★★★

// RSSフィードコンテンツを返すルートハンドラ
export async function GET() {
    
    // 1. 最新の商品データを取得
    // 商品取得関数 (getProducts) を利用し、ページ1の最新の商品を取得
    const productData = await getProducts({ page: 1, limit: FEED_LIMIT });
    const latestProducts: Product[] = productData.products;

    if (latestProducts.length === 0) {
        // 商品が取得できない場合は空のフィードを返す（または404）
        return new NextResponse(generateRssXml([]), {
            status: 200,
            headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        });
    }

    // 2. RSS XMLコンテンツを生成
    const xmlContent = generateRssXml(latestProducts);

    // 3. XMLレスポンスを返す
    return new NextResponse(xmlContent, {
        status: 200,
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=600, must-revalidate', // キャッシュ設定
        },
    });
}


/**
 * Product配列を受け取り、RSS 2.0形式のXML文字列を生成するヘルパー関数
 */
function generateRssXml(products: Product[]): string {
    // 最終更新日: 最新商品の更新日または現在時刻
    const lastBuildDate = products[0]?.updated_at 
        ? new Date(products[0].updated_at).toUTCString() 
        : new Date().toUTCString();

    const items = products.map(product => {
        // descriptionはCDATAセクションに入れてHTMLエンティティをエスケープ
        const description = product.description 
            ? `<![CDATA[${product.description}]]>` 
            : `<![CDATA[${product.name} の詳細情報。価格: ¥${product.price.toLocaleString()}]]>`;
            
        // 最終更新日がない場合は、現在時刻を使用（API仕様に依存）
        const pubDate = product.updated_at 
            ? new Date(product.updated_at).toUTCString() 
            : new Date().toUTCString();
            
        return `
    <item>
        <title>${product.name}</title>
        <link>${BASE_URL}/product/${product.id}</link>
        <guid isPermaLink="true">${BASE_URL}/product/${product.id}</guid>
        <description>${description}</description>
        <pubDate>${pubDate}</pubDate>
        <category>商品</category>
    </item>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>${SITE_TITLE}</title>
        <link>${BASE_URL}</link>
        <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
        <description>${SITE_DESCRIPTION}</description>
        <language>ja</language>
        <lastBuildDate>${lastBuildDate}</lastBuildDate>
        <generator>Next.js App Router</generator>
        ${items}
    </channel>
</rss>`;
    return xml;
}