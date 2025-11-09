// /var/www/bic-saving.com/app/layout.tsx の修正 (全体デザインのラッパー)

import Link from 'next/link';
import './globals.css'; // グローバルCSSをインポート
import React from 'react'; // ★★★ 修正: Reactをインポート

export const metadata = {
    title: 'ビック的節約生活',
    description: 'アイコンを使ってリンクシェア商品を紹介するサイト',
};

// ヘッダーコンポーネント (ドロップダウン機能はCSSで仮置き)
function Header() {
    return (
        <header className="header">
            <div className="container">
                <div className="header-content">
                    {/* 左: ロゴ、タイトル、ドロップダウンメニュー（仮） */}
                    <div className="header-left">
                        <span className="site-logo">💰</span>
                        <Link href="/" className="site-title">
                            ビック的節約生活
                        </Link>
                        {/* メニュー（ドロップダウン式、実装は仮） */}
                        <nav>
                            <Link href="#" style={{ marginLeft: '20px' }}>メニュー ▼</Link>
                        </nav>
                    </div>

                    {/* 右: 検索、ログイン関連（仮） */}
                    <div className="header-right">
                        <input type="search" placeholder="商品を検索..." style={{ padding: '6px', border: '1px solid var(--color-border)', borderRadius: '4px' }} />
                        <Link href="#">
                            <span className="icon">👤</span>ログイン ▼
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}

// フッターコンポーネント
function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    {/* 1列目 */}
                    <div className="footer-section">
                        <h4>サービス情報</h4>
                        <ul>
                            <li><Link href="#">サイト概要</Link></li>
                            <li><Link href="#">お問い合わせ</Link></li>
                            <li><Link href="#">プライバシーポリシー</Link></li>
                        </ul>
                    </div>
                    {/* 2列目 */}
                    <div className="footer-section">
                        <h4>カテゴリ一覧</h4>
                        <ul>
                            <li><Link href="#">生活家電</Link></li>
                            <li><Link href="#">美容・健康</Link></li>
                            <li><Link href="#">アウトドア</Link></li>
                        </ul>
                    </div>
                    {/* 3列目 */}
                    <div className="footer-section">
                        <h4>運営情報</h4>
                        <p style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                            BIC SAVINGは、日常の節約に役立つ商品とリンクシェア情報を紹介しています。
                        </p>
                    </div>
                </div>
            </div>
            <div className="copyright">
                &copy; {new Date().getFullYear()} BIC SAVING. All rights reserved.
            </div>
        </footer>
    );
}

// ★★★ 修正: children に型 (React.ReactNode) を定義 ★★★
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ja">
            <body>
                <Header />
                {/* children が /app/page.js や他のページコンポーネントの内容 */}
                <div className="container">
                    {children}
                </div>
                <Footer />
            </body>
        </html>
    );
}