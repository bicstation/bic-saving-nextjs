// /lib/api.ts

interface MerchantData {
    merchant_id: string;
    merchant_name: string;
    domain_name: string;
}

/**
 * バックエンドAPIを呼び出し、ドメインに対応するMIDを解決する
 * @param domain - 検索するドメイン名 (例: "www.fmv.com" または "fmv.com")
 * @returns MerchantDataオブジェクト、または見つからない場合はnull
 */
export async function resolveMerchantId(domain: string): Promise<MerchantData | null> {
    
    // APIのベースURLを環境変数から取得（例: "https://api.bic-saving.com"）
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const endpoint = `${API_BASE_URL}/api/v1/affiliate/mid-resolve`;
    
    // バックエンドAPIが www.なし の形式を期待しているため、そのまま渡すか、
    // バックエンドで正規化しているため、ここではそのまま渡してもOK。
    const url = `${endpoint}?domain=${encodeURIComponent(domain)}`;

    try {
        // Next.jsのfetchでキャッシュ無効化（常に最新の情報を取得）
        const response = await fetch(url, { cache: 'no-store' });

        if (response.ok) {
            return (await response.json()) as MerchantData;
        }

        // 404 Not Found の場合、MIDが見つからなかったと判断し、nullを返す
        if (response.status === 404) {
            return null;
        }

        // その他のエラー (400, 500など)
        throw new Error(`API Error: ${response.status} - ${await response.text()}`);

    } catch (error) {
        console.error(`Error resolving merchant ID for domain ${domain}:`, error);
        return null; // エラーが発生した場合は変換をスキップ
    }
}