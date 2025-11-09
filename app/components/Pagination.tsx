// /app/components/Pagination.tsx (searchParams 赤線解消版)

'use client'; 

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation'; 
import React from 'react';

// --- 1. Propsの型定義 ---
interface PaginationProps {
    totalPages: number;
}

// --- 2. コンポーネント本体 (型を適用) ---

export default function Pagination({ totalPages }: PaginationProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    
    // URLから現在のページを取得し、数値に変換
    const currentPage: number = parseInt(searchParams?.get('page') || '1', 10);

    // ★★★ 修正箇所: searchParams が null でないことを確認し、安全に URLSearchParams を作成 ★★★
    // searchParamsがnullの場合は、空のURLSearchParamsオブジェクトを渡します。
    const currentSearchParams = searchParams ? searchParams.toString() : '';

    const createPageURL = (pageNumber: number): string => {
        // 現在のクエリ文字列を基に新しい URLSearchParams を作成
        const params = new URLSearchParams(currentSearchParams);
        params.set('page', pageNumber.toString());
        
        // pathname (string) に新しいクエリパラメータを結合
        return `${pathname}?${params.toString()}`;
    };
    // ★★★ 修正終わり ★★★

    // ページネーションのロジック (省略)
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
        <div className="pagination">
            {uniquePages.map((pageNumber, index) => {
                if (index > 0 && pageNumber > uniquePages[index - 1] + 1) {
                    return (
                        <span key={`dots-before-${pageNumber}`} className="page-number">
                            ...
                        </span>
                    );
                }
                
                const isActive = pageNumber === currentPage;
                return (
                    <Link
                        key={pageNumber}
                        href={createPageURL(pageNumber)}
                        className={`page-number ${isActive ? 'active' : ''}`}
                    >
                        {pageNumber}
                    </Link>
                );
            })}
        </div>
    );
}