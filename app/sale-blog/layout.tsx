// /app/sale-blog/layout.tsx (最終版 - 左サイドバー削除)

import React from "react";
import Script from "next/script";
// Linkは不要なので削除

// WordPress API連携に必要な関数と型をインポート
import { getWPCategories, WPCategory, getWPTags, WPTag } from "@/lib/wordpress"; 
// ★修正: Category 型を EcCategory としてインポートし、名前の衝突を回避
import { getTopCategories, Category as EcCategory } from "@/lib/bic-saving"; 

// BlogSidebar コンポーネントをインポート
import BlogSidebar from "../components/BlogSidebar"; 

// ISR の設定: 1時間 (3600秒) ごとにバックグラウンドで再生成
export const revalidate = 3600;

interface SaleBlogLayoutProps {
children: React.ReactNode;
}

export default async function SaleBlogLayout({ children }: SaleBlogLayoutProps) {
let wpCategories: WPCategory[] = []; 
// ★修正: EcCategory 型を使用
let ecCategories: EcCategory[] = []; 
let wpTags: WPTag[] = []; 

try {
const [wpCategoryData, ecData, wpTagData] = await Promise.all([
getWPCategories().catch((e) => { console.error("Error fetching WP categories:", e); return []; }), 
getTopCategories().catch((e) => { console.error("Error fetching EC categories:", e); return []; }), 
getWPTags().catch((e) => { console.error("Error fetching WP tags:", e); return []; }), 
]);

wpCategories = wpCategoryData;
// ★修正: ecData を EcCategory 型として扱う
ecCategories = ecData as EcCategory[];
wpTags = wpTagData; 
} catch (error) {
console.error("Failed to fetch sidebar data unexpectedly:", error);
}

const safeWpCategories = Array.isArray(wpCategories) ? wpCategories : [];
// ★修正: safeEcCategories の配列チェック
const safeEcCategories = Array.isArray(ecCategories) ? ecCategories : [];
const safeWpTags = Array.isArray(wpTags) ? wpTags : [];


return (
<>
{/* メインコンテンツとサイドバーをフレックスボックスで並べるコンテナ */}
<div style={{ 
    display: "flex", 
    maxWidth: "1600px", 
    margin: "0 auto", 
    padding: "20px", 
    gap: '40px' 
}}>

{/* ★ 1. 左サイドバーエリア (管理メニューなど) - 完全に削除 ★ */}


{/* 2. メインコンテンツエリア (children) */}
{/* 左サイドバーが削除されたため、paddingLeftは不要かもしれませんが、残します */}
<div style={{ flexGrow: 1, minWidth: "0", paddingLeft: "0" }}>
{children}
</div>

{/* 3. 右サイドバーエリア (BlogSidebar: サイト全体メニュー、ブログカテゴリなど) */}
<BlogSidebar 
categories={safeWpCategories}
ecCategories={safeEcCategories}
tags={safeWpTags}
style={{ flex: '0 0 280px', minWidth: '280px' }} 
/>
</div>

{/* 楽天 Automate スクリプトを外部ファイルとしてロード */}
{/* <Script
id="rakuten-automate"
src="/js/rakuten-automate.js" 
strategy="afterInteractive" 
/> */}
</>
);
}