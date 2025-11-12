// /app/sale-blog/layout.tsx

import React from "react";
// 外部スクリプト（アフィリエイト）のために next/script をインポート
import Script from "next/script";

// WordPress API連携に必要な関数と型をインポート
import { getWPCategories, WPCategory } from "@/lib/wordpress";
// ECサイト API連携に必要な関数と型をインポート
import { getTopCategories, Category } from "@/lib/bic-saving";

// BlogSidebar コンポーネントをインポート
import BlogSidebar from "../components/BlogSidebar";

// ISR の設定: 1時間 (3600秒) ごとにバックグラウンドで再生成
export const revalidate = 3600;

// レイアウトコンポーネントはデータを取得するため async function に変更
export default async function SaleBlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let wpCategories: WPCategory[] = []; // WordPressカテゴリ
  let ecCategories: Category[] = []; // ECサイトカテゴリ

  try {
    // WordPressカテゴリとECサイトカテゴリのデータを並列で取得
    const [wpData, ecData] = await Promise.all([
      getWPCategories(),
      getTopCategories(),
    ]);

    wpCategories = wpData;
    ecCategories = ecData;
  } catch (error) {
    // データ取得に失敗した場合でも、エラーを出力し、レンダリングは続行
    console.error("Failed to fetch sidebar data:", error);
  }

  return (
    // Fragment (<>...</>) を使用して、<div> と <Script> をラップ
    <>
      {/* メインコンテンツとサイドバーをフレックスボックスで並べるコンテナ */}
      {/* 修正点: gap: '40px' を追加し、padding で左右の余白も確保 */}
      <div style={{ display: "flex", maxWidth: "1600px", margin: "0 auto", padding: "20px", gap: '40px' }}>
        
        {/* 1. 左サイドバーエリア */}
        {/* 修正点: flexGrow: 0, flexShrink: 0, width: '280px' で幅を固定 */}
        {/* BlogSidebarにstyleプロパティを渡す。これにはBlogSidebarコンポーネント側の型定義の修正が必要です。 */}
        <BlogSidebar
          wpCategories={wpCategories} // WordPressカテゴリ
          ecCategories={ecCategories} // ECサイトカテゴリ
          style={{ flexGrow: 0, flexShrink: 0, width: '280px' }} // サイドバーの幅を固定
        />

        {/* 2. メインコンテンツエリア (children) */}
        {/* 修正点: flexGrow: 1 で残りのスペースを占有、paddingLeft を削除/0 にして gap に任せる */}
        <div style={{ flexGrow: 1, minWidth: "0", paddingLeft: "0" }}>
            {children}
        </div>
      </div>

      {/* Rakuten Automate スクリプトを body の最後に挿入 */}
      <Script
        id="rakuten-automate"
        strategy="afterInteractive" 
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
                for(let i=0; i<_rakuten_automate.events.length; i++) {
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