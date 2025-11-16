// /components/AffiliateCard.tsx

/**
 * デルのアフィリエイトリンク情報を受け取り、ブログカードとしてレンダリングするコンポーネント
 * * @note このコンポーネントはクライアント側で必要な情報をレンダリングする
 */
interface AffiliateCardProps {
    clickUrl: string;
    landUrl: string;
    title: string;
    vendor: string;
    // 必要に応じて画像URLや価格などの情報を追加
}

export const AffiliateCard = ({ clickUrl, landUrl, title, vendor }: AffiliateCardProps) => {
    
    // 画像や詳細はランディングURLから別途取得する必要がありますが、
    // ここではまず、リンクとタイトルのみを表示する簡易版を作成します。
    
    return (
        <div 
            className="affiliate-card-wrapper" 
            style={{ 
                border: '1px solid #ddd', 
                padding: '15px', 
                margin: '20px 0', 
                borderRadius: '8px',
                backgroundColor: '#f9f9f9'
            }}>
            
            <h3 style={{ marginTop: 0, fontSize: '1.2em' }}>
                {title} ({vendor})
            </h3>
            
            <a 
                href={clickUrl} 
                target="_blank" 
                rel="nofollow noopener"
                style={{ 
                    display: 'inline-block', 
                    padding: '8px 15px', 
                    backgroundColor: '#0070f3', 
                    color: 'white', 
                    textDecoration: 'none', 
                    borderRadius: '4px' 
                }}>
                公式サイトで詳細を見る
            </a>
            
            <p style={{ fontSize: '0.8em', color: '#666', marginTop: '10px' }}>
                （トラッキングURL: {clickUrl.substring(0, 50)}...）
            </p>
        </div>
    );
};