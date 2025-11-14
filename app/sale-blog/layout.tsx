// /app/sale-blog/layout.tsx

import React from "react";
import Script from "next/script";

// WordPress API連携に必要な関数と型をインポート
import { getWPCategories, WPCategory, getWPTags, WPTag } from "@/lib/wordpress"; 
// ECサイト API連携に必要な関数と型をインポート
// Category 型は /lib/bic-saving でエクスポートされている必要があります
import { getTopCategories, Category } from "@/lib/bic-saving";

// BlogSidebar コンポーネントをインポート
import BlogSidebar from "../components/BlogSidebar";

// ISR の設定: 1時間 (3600秒) ごとにバックグラウンドで再生成
export const revalidate = 3600;

// レイアウトコンポーネントのProps型
interface SaleBlogLayoutProps {
children: React.ReactNode;
}

// レイアウトコンポーネントはデータを取得するため async function に変更
export default async function SaleBlogLayout({ children }: SaleBlogLayoutProps) {
let wpCategories: WPCategory[] = []; // WordPressカテゴリ
let ecCategories: Category[] = []; // ECサイトカテゴリ
let wpTags: WPTag[] = [];  // WordPressタグ

try {
// WordPressカテゴリ、ECサイトカテゴリ、WordPressタグのデータを並列で取得
const [wpCategoryData, ecData, wpTagData] = await Promise.all([
getWPCategories().catch((e) => { 
    console.error("Error fetching WP categories:", e);
    return [];
  }), 
getTopCategories().catch((e) => {
    console.error("Error fetching EC categories:", e);
    return [];
  }), 
getWPTags().catch((e) => {
    console.error("Error fetching WP tags:", e);
    return [];
  }), 
]);

wpCategories = wpCategoryData;
ecCategories = ecData;
wpTags = wpTagData; 
} catch (error) {
  // Promise.all の外側でキャッチする可能性は低いが、念のため
 console.error("Failed to fetch sidebar data unexpectedly:", error);
}

// BlogSidebar が必要とするプロパティが配列であることを保証する (安全な防御策)
const safeWpCategories = Array.isArray(wpCategories) ? wpCategories : [];
const safeEcCategories = Array.isArray(ecCategories) ? ecCategories : [];
const safeWpTags = Array.isArray(wpTags) ? wpTags : [];


return (
<>
{/* メインコンテンツとサイドバーをフレックスボックスで並べるコンテナ */}
<div style={{ display: "flex", maxWidth: "1600px", margin: "0 auto", padding: "20px", gap: '40px' }}>
 
 {/* 1. 左サイドバーエリア (BlogSidebar) */}
 {/* ★修正: BlogSidebar.tsxが期待するプロパティ名 (categories, tags) に合わせる */}
 <BlogSidebar 
 categories={safeWpCategories} // wpCategories -> categories に変更
 ecCategories={safeEcCategories}
 tags={safeWpTags}     // wpTags -> tags に変更
 style={{ flex: '0 0 280px', minWidth: '280px' }} 
 />


 {/* 2. メインコンテンツエリア (children) */}
 <div style={{ flexGrow: 1, minWidth: "0", paddingLeft: "0" }}>
 {children}
 </div>

 {/* 3. 右サイドバーエリア (3カラムを実現するためのスペース) */}
 {/* 左右にメニューを分ける場合、右側のメニュー内容に応じてこの<div>内にコンポーネントを配置 */}
 <div style={{ flex: '0 0 280px', minWidth: '280px', backgroundColor: 'transparent' }}>
   {/* ここに右側のサイドバーコンポーネントを配置 */}
 </div>
</div>

{/* 楽天 Automate スクリプトを外部ファイルとしてロード */}
{/* これによりSSG時のJSパースエラーを回避 */}
<Script
 id="rakuten-automate"
 src="/js/rakuten-automate.js" 
 strategy="afterInteractive" 
/>
</>
);
}