// /app/components/Header.tsx

import Link from 'next/link';
import SearchBar from './SearchBar'; // 検索バーをインポート（既に存在すると仮定）

// Next.jsのServer Componentとして動作します

export default function Header() {
    // リンクの共通スタイル
    const linkStyle: React.CSSProperties = {
        color: 'white',
        textDecoration: 'none',
        marginRight: '20px'
    };
    
    return (
        <header style={{ 
            backgroundColor: '#333', 
            color: 'white', 
            padding: '10px 20px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            position: 'sticky', // ヘッダーを固定
            top: 0,
            zIndex: 1000,
        }}>
            {/* ロゴ/ホームリンク */}
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                <Link href="/" style={{ color: 'white', textDecoration: 'none' }}>
                    BIC-SAVING
                </Link>
            </div>

            {/* 検索バー */}
            <div style={{ flexGrow: 1, margin: '0 40px', maxWidth: '600px' }}>
                {/* SearchBarコンポーネントが /app/components/SearchBar.tsx にあると仮定 */}
                <SearchBar />
            </div>

            {/* ナビゲーション/アクションボタン */}
            <nav>
                <Link href="/" style={linkStyle}>
                    ホーム
                </Link>
                
                {/* ★★★ セール情報ブログへのリンクを追加 ★★★ */}
                <Link href="/sale-blog" style={linkStyle}>
                    セール情報
                </Link>
                
                <Link href="/cart" style={{ color: 'white', textDecoration: 'none' }}>
                    カート (0)
                </Link>
            </nav>
        </header>
    );
}