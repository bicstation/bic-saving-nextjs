// /app/components/Pagination.tsx (最終修正版 - ページネーションの汎用化)

'use client'; 

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation'; // usePathname をインポート
import React from 'react';

// --- 1. Propsの型定義 ---
interface PaginationProps {
    totalPages: number;
    currentPage: number; // 呼び出し元 (Server Component) から渡される現在のページ
    basePath?: string;   // ★★★ 修正: basePath をオプショナルにする ★★★
}

// --- 2. コンポーネント本体 (型を適用) ---

export default function Pagination({ totalPages, currentPage, basePath: propsBasePath }: PaginationProps) {
    
    const searchParams = useSearchParams();
    const pathname = usePathname(); // 現在のパスを取得
    
    // ★★★ 修正: propsBasePath が渡されなかった場合、現在のパス (pathname) を basePath として使用する ★★★
    const basePath = propsBasePath || pathname;
    
    
    // createPageURL のロジック
    const createPageURL = (pageNumber: number): string => {
        // 現在の searchParams のコピーを安全に作成
        const params = new URLSearchParams(searchParams?.toString() || '');
        
        // ページ番号を設定
        params.set('page', pageNumber.toString());
        
        // クエリ文字列を生成
        const queryString = params.toString();
        
        // basePath (pathnameまたは渡された値) にクエリパラメータを結合
        return `${basePath}${queryString ? `?${queryString}` : ''}`;
    };
    // ★★★ 修正終わり ★★★

    // ページネーションのロジック
    const maxPagesToShow = 10;
    const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    const pagesToShow: number[] = [];
    
    
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