// /app/components/Pagination.tsx (最終修正版 - MakerPageからのProps欠落エラー解消)

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
    // 従来のロジック (useSearchParamsとusePathnameを使う方式) を維持しつつ、
    // MakerPageから渡された basePath を URL 生成に使用します。
    // Next.jsのルーティングフックを使用するため、useSearchParamsとusePathnameを残します。

    const searchParams = useSearchParams();
    
    // URLから現在のページを取得し、数値に変換 (ただし、MakerPageからcurrentPageが渡されているので、ここでは使用しないことも可能)
    // MakerPageのcurrentPageを使用することで、Server Componentの値を優先する
    // const currentPage: number = parseInt(searchParams?.get('page') || '1', 10); // この行はMakerPageの値を優先するため、コメントアウトまたは削除します。

    // ★★★ 修正箇所: searchParams が null でないことを確認し、安全に URLSearchParams を作成 ★★★
    // basePathを使用するため、usePathnameは不要になります
    // const pathname = usePathname(); // basePath があれば不要
    
    // searchParamsのtoString()は useSearchParams()の結果のインスタンスに対してのみ使用できます
    const currentSearchParams = searchParams ? searchParams.toString() : '';


    const createPageURL = (pageNumber: number): string => {
        // 現在のクエリ文字列を基に新しい URLSearchParams を作成
        // ここで、searchParamsのインスタンス自体を使用する方が Next.js の推奨パターンです
        
        // basePath (例: /maker/oshare-walker-43) を利用し、クエリを追加する
        const params = new URLSearchParams(currentSearchParams);
        params.set('page', pageNumber.toString());
        
        // basePath (string) に新しいクエリパラメータを結合
        return `${basePath}?${params.toString()}`;
    };
    // ★★★ 修正終わり ★★★

    // ページネーションのロジック
    const maxPagesToShow = 10;
    const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    const pagesToShow: number[] = [];

    // ... (ページネーションロジックは省略せずにそのまま維持します)
    
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