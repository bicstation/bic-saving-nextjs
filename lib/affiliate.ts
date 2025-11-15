// /lib/affiliate.ts

// RAKUTEN_AFFILIATE_ID は環境変数から自動的に読み込まれる
const RAKUTEN_ID = process.env.RAKUTEN_AFFILIATE_ID;

/**
 * リンクシェア（Rakuten Affiliate Network）のディープリンクURLを生成する関数
 * @param originalUrl - 商品の元のECサイトURL (例: "https://jp.ext.hp.com/...")
 * @param merchantId - リンクシェアが指定するマーチャントID (例: HPなら "35909")
 * @returns リンクシェア経由のトラッキングURL
 */
export function generateAffiliateUrl(originalUrl: string, merchantId: string): string {
    // 1. IDが設定されていない場合は、元のURLをそのまま返す
    if (!RAKUTEN_ID) {
        console.error("RAKUTEN_AFFILIATE_ID is not defined in the environment.");
        return originalUrl;
    }
    
    // 2. 最終リンク先URLをURLエンコードする (murlパラメータの値)
    const encodedUrl = encodeURIComponent(originalUrl);

    // 3. リンクシェアのディープリンク形式に合わせてURLを組み立てる
    // 形式: https://click.linksynergy.com/deeplink?id={アフィリエイトID}&mid={マーチャントID}&murl={エンコードされた元URL}
    const affiliateUrl = `https://click.linksynergy.com/deeplink?id=${RAKUTEN_ID}&mid=${merchantId}&murl=${encodedUrl}`;

    return affiliateUrl;
}