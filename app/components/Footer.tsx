// /app/components/Footer.tsx

// Next.jsのServer Componentとして動作します

import Link from 'next/link';
import React from 'react';

export default function Footer() {
    // 構造を分かりやすくするため、スタイリングはインラインスタイルで行います。
    
    // フッター全体の基本スタイル
    const footerStyle: React.CSSProperties = {
        backgroundColor: '#333', 
        color: '#fff', 
        padding: '40px 20px', 
        marginTop: '40px',
        borderTop: '5px solid #0070f3', // ブランドカラーを反映
    };

    // 3列を管理するコンテナスタイル (Flexboxを使用)
    const containerStyle: React.CSSProperties = {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        maxWidth: '1200px',
        margin: '0 auto',
        gap: '30px', // 列間のスペース
    };

    // 各列のスタイル
    const columnStyle: React.CSSProperties = {
        flex: '1 1 300px', // 最小幅300px, 成長/縮小可能
        minWidth: '200px',
    };
    
    // リンクのスタイル
    const linkStyle: React.CSSProperties = {
        color: '#ccc',
        textDecoration: 'none',
        display: 'block', // リンクを縦に並べる
        margin: '8px 0',
        fontSize: '0.9rem',
        transition: 'color 0.2s',
    };
    
    // hover時のスタイル (Client Componentではないため、擬似クラスはインラインで表現できない点に注意)
    // 実際にはCSS/Tailwindなどで処理すべきだが、ここでは基本形を維持

    return (
        <footer style={footerStyle}>
            <div style={containerStyle}>
                
                {/* 1列目: 会社情報 / サイト情報 */}
                <div style={columnStyle}>
                    <h4 style={{ borderBottom: '1px solid #555', paddingBottom: '10px', marginBottom: '15px' }}>🏢 BIC-SAVINGについて</h4>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                        BIC-SAVINGは、高品質な商品を業界最安値で提供するECプラットフォームです。型安全でモダンなNext.js技術を採用し、快適なショッピング体験をお届けします。
                    </p>
                    <Link href="/" style={{...linkStyle, color: '#0070f3', marginTop: '15px'}}>トップページへ</Link>
                    {/* ★修正: /about へのリンクを追加 */}
                    <Link href="/about" style={{...linkStyle, color: '#0070f3'}}>会社概要</Link>
                </div>

                {/* 2列目: カスタマーサービス / ヘルプ */}
                <div style={columnStyle}>
                    <h4 style={{ borderBottom: '1px solid #555', paddingBottom: '10px', marginBottom: '15px' }}>📞 カスタマーサービス</h4>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {/* ★修正: /contact へのリンクを修正 */}
                        <li><Link href="/contact" style={linkStyle}>お問い合わせ</Link></li>
                        {/* FAQは/faqを想定 */}
                        <li><Link href="/faq" style={linkStyle}>よくある質問 (FAQ)</Link></li>
                        <li><Link href="#" style={linkStyle}>配送・送料について</Link></li>
                        <li><Link href="#" style={linkStyle}>返品・交換ポリシー</Link></li>
                    </ul>
                </div>

                {/* 3列目: 法的情報 / ソーシャル */}
                <div style={columnStyle}>
                    <h4 style={{ borderBottom: '1px solid #555', paddingBottom: '10px', marginBottom: '15px' }}>📄 法的情報・関連リンク</h4>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li><Link href="#" style={linkStyle}>利用規約</Link></li>
                        <li><Link href="#" style={linkStyle}>プライバシーポリシー</Link></li>
                        <li><Link href="#" style={linkStyle}>特定商取引法に基づく表記</Link></li>
                        {/* ★追加: RSSフィードへのリンク */}
                        <li><Link href="/rss.xml" style={linkStyle} target="_blank" rel="noopener noreferrer">RSSフィード</Link></li>
                    </ul>
                    <div style={{ marginTop: '20px' }}>
                        <span style={{ marginRight: '15px', fontSize: '1.5rem' }}>🐦</span>
                        <span style={{ marginRight: '15px', fontSize: '1.5rem' }}>📘</span>
                        <span style={{ fontSize: '1.5rem' }}>📸</span>
                    </div>
                </div>

            </div>
            
            {/* 著作権表示 */}
            <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #555' }}>
                <p style={{ margin: '5px 0', fontSize: '0.8rem' }}>&copy; {new Date().getFullYear()} BIC-SAVING. All rights reserved.</p>
                <p style={{ margin: '5px 0', fontSize: '0.7rem', color: '#888' }}>本サイトは学習プロジェクトであり、特定のサービスを販売するものではありません。</p>
            </div>
        </footer>
    );
}