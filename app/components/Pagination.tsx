// /app/components/Pagination.tsx (最終修正版 - MakerPageからのProps欠落エラー解消 & URL生成ロジック修正)

'use client'; 

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation'; 
import React from 'react';

// --- 1. Propsの型定義 ---
interface PaginationProps {
    totalPages: number;
    // ★★★ 修正: MakerPageで渡されていたプロパティを追加 ★★★
    currentPage: number; // MakerPageから渡される current page
    basePath: string;    // MakerPageから渡される /maker/[makerSlug] のベースパス
}

// --- 2. コンポーネント本体 (型を適用) ---

// ★修正: Propsの分割代入に currentPage と basePath を追加 ★
export default function Pagination({ totalPages, currentPage, basePath }: PaginationProps) {
    
    const searchParams = useSearchParams();
    
    // ★★★ 修正箇所: createPageURL のロジックをシンプルかつ安全にする ★★★
    const createPageURL = (pageNumber: number): string => {
        // 現在の searchParams のコピーを安全に作成
        // searchParams?.toString() || '' で null の場合でも空文字列として扱える
        const params = new URLSearchParams(searchParams?.toString() || '');
        
        // ページ番号を設定
        params.set('page', pageNumber.toString());
        
        // basePath (例: /maker/oshare-walker-43) にクエリパラメータを結合
        const queryString = params.toString();
        
        // クエリ文字列が存在する場合のみ "?" をつける
        return `${basePath}${queryString ? `?${queryString}` : ''}`;
    };
    // ★★★ 修正終わり ★★★

    // ページネーションのロジック
    const maxPagesToShow = 10;
    const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    const pagesToShow: number[] = [];
    
    // ... (ページネーションロジックの維持)
    
    if (totalPages > 1 && !pagesToShow.includes(1)) {
        pagesToShow.push(1);
    }
    for (let i = startPage; i <= endPage; i++) {
        if (!pagesToShow.includes(i)) {
            pagesToShow.push(i);
        }
    }
    if (totalPages > 1 && !pagesToShow.includes(totalPages)) {
        pagesToShow.push(totalPages);
    }

    const uniquePages = [...new Set(pagesToShow)].sort((a, b) => a - b);

    if (totalPages <= 1) {
        return null;
    }

    // --- 3. レンダー部分 ---
    return (
        <div className="pagination flex justify-center items-center space-x-2 mt-8">
            {uniquePages.map((pageNumber, index) => {
                if (index > 0 && pageNumber > uniquePages[index - 1] + 1) {
                    return (
                        <span key={`dots-before-${pageNumber}`} className="page-number text-gray-500">
                            ...
                        </span>
                    );
                }
                
                const isActive = pageNumber === currentPage;
                return (
                    <Link
                        key={pageNumber}
                        href={createPageURL(pageNumber)}
                        className={`page-number px-3 py-1 border rounded transition duration-150 ease-in-out ${
                            isActive
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                    >
                        {pageNumber}
                    </Link>
                );
            })}
        </div>
    );
}