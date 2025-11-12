// app/sale-blog/layout.tsx

import React from 'react';

// WordPress API連携
import { getWPCategories, WPCategory } from "@/lib/wordpress"; 
// ★ECサイト API連携 (前提: lib/bic-saving に定義済み)★
import { getTopCategories, Category } from "@/lib/bic-saving"; 

// ★パス修正済み: layout.tsx から見て一つ上の階層にある components フォルダを参照
import BlogSidebar from '../components/BlogSidebar'; 

// ISR の設定: 1時間 (3600秒) ごとに再生成
export const revalidate = 3600; 

// 修正: async を追加し、データ取得をLayoutで行うように変更
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
        // データ取得に失敗した場合
        // 開発環境ではコンソールにエラーを出力し、本番環境では空の配列を渡して表示を継続
        console.error("Failed to fetch sidebar data:", error); 
    }
    
    return (
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
    );
}