// /lib/api.ts

interface MerchantData {
    // APIがnullを返す可能性があるため、string | null を許容するように修正
    merchant_id: string | null;
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

    const endpoint = `${API_BASE_URL}/api/v1/affiliate/mid-resolve/`;
    
    // バックエンドで www.有無 の正規化を実装済み
    const url = `${endpoint}?domain=${encodeURIComponent(domain)}`;
    console.log(`  エンドポイント URL: ${url}`); // ★★★ URL確認用 ★★★

    try {
        const response = await fetch(url, {
            // ★キャッシュ設定を明示し、最新のAPI応答を取得★
            cache: 'no-store', 
        });

        // ★★★ 修正箇所: response.text() を最初に呼び出し、ストリーム消費を一元化 ★★★
        const responseText = await response.text();
        
        // 404 Not Found の場合、MIDが見つからなかったと判断し、nullを返す
        if (response.status === 404) {
            console.log(`[DEBUG: API NOT FOUND] Domain: ${domain}. Status 404.`);
            return null;
        }

        // 200 OKの場合、またはその他の成功ステータスの場合 (response.ok)
        if (response.ok) { 
            try {
                // responseTextからJSONへのパースを試みる (response.json()の代替)
                const data = JSON.parse(responseText) as MerchantData;
                
                // データが正しくパースされ、merchant_idが有効な文字列の場合のみ返す
                if (data && data.merchant_id && data.merchant_id.length > 0) {
                    console.log(`[DEBUG: API SUCCESS] Domain: ${domain}, MID: ${data.merchant_id}`);
                    return data;
                } else {
                    // MIDが見つからなかった、または無効だったがStatus 200が返ってきた場合のログ
                    console.log(`[DEBUG: API NO MID] Domain: ${domain}. Status 200 but MID is missing or invalid. Data:`, data);
                    return null;
                }
            } catch (jsonError) {
                // JSONパースに失敗した場合（Status 200だがHTML/テキストが返ってきた場合など）
                console.error(`API Error (JSON Parse Failed) for domain ${domain}: Status ${response.status}. Response: ${responseText}`);
                return null;
            }
        }

        // 200/404以外の失敗ステータスの場合 (400, 500など)
        // ここに Status 500 の HTML エラーが流れ込んでいる
        console.error(`API Error for domain ${domain}: Status ${response.status}. Response: ${responseText}`);
        console.log(`[DEBUG: API FAILED] Domain: ${domain}. Returning null.`);
        return null;

    } catch (error) {
        // ネットワークエラーなど
        console.error(`Error resolving merchant ID for domain ${domain}:`, error);
        return null; // エラーが発生した場合は変換をスキップ
    }
}