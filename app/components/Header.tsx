// /app/components/Header.tsx

"use client"; // ★★★ 修正1: Client Component化（Hydration Error対策） ★★★

import Link from 'next/link';
import { useState } from 'react'; // ★★★ 修正2: State管理のためにuseStateをインポート ★★★
import SearchBar from './SearchBar';
// アイコンを使用する場合、React Iconsなどをインポート
import { Menu, X, ShoppingCart } from 'lucide-react'; // アイコンライブラリを仮定

export default function Header() {
    // ★★★ 修正3: モバイルメニューの開閉状態を管理 ★★★
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "ビック的節約生活";

    // インラインスタイルを削除し、グローバルCSSのクラスを使用
    return (
        // style={{...}} を削除し、className="header" を適用
        <header className="header"> 
            
            {/* ヘッダーコンテンツを.containerでラップして中央寄せとパディングを適用 */}
            <div className="container">
                <div className="header-content">
                    
                    {/* 1. ロゴ/ホームリンク (.header-left の役割) */}
                    <div className="header-left">
                        <Link href="/" className="site-title">
                            {siteName}
                        </Link>
                    </div>

                    {/* 2. 検索バー (PCでは中央、スマホでは下に配置) */}
                    <div className="header-center">
                        <SearchBar />
                    </div>

                    {/* 3. ナビゲーション/アクションボタン (.header-right の役割) */}
                    <div className="header-right">
                        
                        {/* PC用のナビゲーション (グローバルCSSで非表示に設定可能) */}
                        <nav className="pc-nav-links"> 
                            <Link href="/" className="menu-link">
                                ホーム
                            </Link>
                            <Link href="/sale-blog" className="menu-link">
                                セール情報
                            </Link>
                        </nav>
                        
                        {/* カートアイコン（PC/スマホ共通） */}
                        <Link href="/cart" className="menu-link" aria-label="カート">
                             <ShoppingCart size={20} /> カート(0)
                        </Link>

                        {/* ★★★ 修正4: ハンバーガーメニューボタン (スマホでのみ表示) ★★★ */}
                        <button 
                            className="menu-button" 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="モバイルメニュー"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                </div>
            </div>

            {/* ★★★ 修正5: モバイルメニュー本体 ★★★ */}
            <nav className={`mobile-nav ${isMenuOpen ? 'open' : ''}`}>
                <div className="container">
                    <Link href="/" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                        ホーム
                    </Link>
                    <Link href="/sale-blog" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                        セール情報
                    </Link>
                    <Link href="/login" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                        ログイン/登録
                    </Link>
                    {/* 他のモバイル専用リンク... */}
                </div>
            </nav>
        </header>
    );
}