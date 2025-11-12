// app/sale-blog/layout.tsx

import React from 'react';
// ★修正: next/script のインポートを追加★
import Script from 'next/script'; 

// WordPress API連携
import { getWPCategories, WPCategory } from "@/lib/wordpress"; 
// ECサイト API連携 (前提: lib/bic-saving に定義済み)
import { getTopCategories, Category } from "@/lib/bic-saving"; 

// パス修正済み: layout.tsx から見て一つ上の階層にある components フォルダを参照
import BlogSidebar from '../components/BlogSidebar'; 

// ISR の設定: 1時間 (3600秒) ごとに再生成
export const revalidate = 3600; 

// async を追加し、データ取得をLayoutで行うように変更
export default async function SaleBlogLayout({
  children, 
}: {
  children: React.ReactNode;
}) {
    let wpCategories: WPCategory[] = []; // WordPressカテゴリ
    let ecCategories: Category[] = []; // ECサイトカテゴリ

    try {
        // WordPressカテゴリとECサイトカテゴリのデータを並列で取得
        // ECサイトカテゴリの取得が失敗してもエラーを投げずに空の配列を返すよう、getTopCategoriesは修正済みと仮定
        const [wpData, ecData] = await Promise.all([
            getWPCategories(),
            getTopCategories(), 
        ]);
        
        wpCategories = wpData;
        ecCategories = ecData;

    } catch (error) {
        // WordPressカテゴリの取得失敗時など、データ取得に失敗した場合
        console.error("Failed to fetch sidebar data:", error); 
    }
    
    return (
        // ★修正: return のフラグメントを正しく閉じるため、<>... </> を使用★
        <> 
            <div style={{ display: 'flex', maxWidth: '1600px', margin: '0 auto' }}>

                {/* 1. 左サイドバーエリア: WPカテゴリとECカテゴリの両方を渡す */}
                <BlogSidebar 
                    wpCategories={wpCategories} // WordPressカテゴリ
                    ecCategories={ecCategories} // ECサイトカテゴリ
                />        

                {/* 2. メインコンテンツエリア */}
                <div style={{ flexGrow: 1, minWidth: '0' }}>
                    {children}
                </div>
            </div>

            {/* Rakuten Automate スクリプトを body の最後に挿入 */}
            <Script
                id="rakuten-automate"
                strategy="afterInteractive" // ページロード後に実行
                dangerouslySetInnerHTML={{
                    __html: `
                        var _rakuten_automate = {
                            u1: "", 
                            snippetURL: "https://automate-frontend.linksynergy.com/minified_logic.js", 
                            automateURL: "https://automate.linksynergy.com", 
                            widgetKey: "t9VuS07SBl0sO0u4jAGNuuSmdGgzHTIn", // あなたの固有のキー
                            aelJS: null, 
                            useDefaultAEL: false, 
                            loaded: false, 
                            events: [] 
                        };
                        var ael = window.addEventListener;
                        window.addEventListener = function(a, b, c, d) {
                            "click" !== a && _rakuten_automate.useDefaultAEL ? ael(a, b, c) : _rakuten_automate.events.push({type: a, handler: b, capture: c, rakuten: d});
                        };
                        _rakuten_automate.links = {};
                        var httpRequest = new XMLHttpRequest;
                        httpRequest.open("GET", _rakuten_automate.snippetURL, !0);
                        httpRequest.timeout = 5E3;
                        httpRequest.ontimeout = function() {
                            if (!_rakuten_automate.loaded) {
                                for(let i=0; i<_rakuten_automate.events.length; i++) { // 変数iをletに変更
                                    var a = _rakuten_automate.events[i];
                                    ael(a.type, a.handler, a.capture);
                                }
                                _rakuten_automate.useDefaultAEL = !0;
                            }
                        };
                        httpRequest.onreadystatechange = function() {
                            httpRequest.readyState === XMLHttpRequest.DONE && 200 === httpRequest.status && (eval(httpRequest.responseText), _rakuten_automate.run(ael));
                        };
                        httpRequest.send(null);
                    `,
                }}
            />
        </>
    );
}