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
  
  // 1. 環境変数からベースURLを取得し、ローカル環境のフォールバックを設定
  const API_BASE_URL_CONFIGURED = process.env.NEXT_PUBLIC_API_BASE_URL;

  // 2. 実行環境に応じて BASE_HOST_URL を決定 (ホスト名のみ)
  const BASE_HOST_URL = 
    API_BASE_URL_CONFIGURED || 
    (process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8003'      // ★ ローカル開発用 (8003) ★
      : 'https://api.bic-saving.com');  // ★ 本番デプロイ用フォールバック ★
  
  // 3. BASE_HOST_URL の末尾のスラッシュを除去してから /api/v1 を結合
  const baseEndpoint = BASE_HOST_URL.replace(/\/$/, '');
  const endpoint = `${baseEndpoint}/api/v1/affiliate/mid-resolve/`;

  // バックエンドで www.有無 の正規化を実装済み
  const url = `${endpoint}?domain=${encodeURIComponent(domain)}`;
  console.log(` エンドポイント URL: ${url}`); 

  try {
    const response = await fetch(url, {
      // ★修正: Next.js の SSG/ISR に対応するため 'no-store' を削除し、revalidate を設定 ★
      // 1時間 (3600秒) キャッシュを設定し、ビルド時に静的生成を可能にする
      next: { revalidate: 3600 }, 
    });

    // ★★★ response.text() を呼び出し、ストリーム消費を一元化 ★★★
    const responseText = await response.text();
    
    // 404 Not Found の場合、MIDが見つからなかったと判断し、nullを返す
    if (response.status === 404) {
      console.log(`[DEBUG: API NOT FOUND] Domain: ${domain}. Status 404.`);
      return null;
    }

    // 200 OKの場合、またはその他の成功ステータスの場合 (response.ok)
    if (response.ok) { 
      try {
        // responseTextからJSONへのパースを試みる
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
        // JSONパースに失敗した場合
        console.error(`API Error (JSON Parse Failed) for domain ${domain}: Status ${response.status}. Response: ${responseText}`);
        return null;
      }
    }

    // 200/404以外の失敗ステータスの場合 (400, 500など)
    console.error(`API Error for domain ${domain}: Status ${response.status}. Response: ${responseText}`);
    console.log(`[DEBUG: API FAILED] Domain: ${domain}. Returning null.`);
    return null;

  } catch (error) {
    // ネットワークエラーなど
    console.error(`Error resolving merchant ID for domain ${domain}:`, error);
    return null; // エラーが発生した場合は変換をスキップ
  }
}