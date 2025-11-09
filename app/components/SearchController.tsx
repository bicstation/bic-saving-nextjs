// /app/components/SearchController.tsx
"use client";

import { useRouter } from 'next/navigation';
import SearchInput from './SearchInput'; // SearchInputをインポート
import React, { useCallback } from 'react';

/**
 * SearchInputとNext.jsのルーターを繋ぎ、検索実行時にページ遷移を担当するコンポーネント。
 */
const SearchController: React.FC = () => {
    // Client Componentなので useRouter が使用可能
    const router = useRouter(); 

    // SearchInputからデバウンス後のキーワードが渡されるコールバック
    const handleSearch = useCallback((query: string) => {
        const trimmedQuery = query.trim();
        
        if (!trimmedQuery) {
            // キーワードが空の場合は、検索結果ページにリダイレクトせず、処理を終了
            // 必要に応じてホームに戻すロジックなどを追加できますが、今回は何もしません
            return;
        }

        // キーワードをクエリパラメータ q として /search ページにリダイレクト
        // URLエンコードして、日本語などの文字を安全に渡す
        const url = `/search?q=${encodeURIComponent(trimmedQuery)}`;
        router.push(url);

    }, [router]);

    return (
        // デバウンス処理済みのキーワードを onSearch コールバックで受け取る
        <SearchInput onSearch={handleSearch} />
    );
};

export default SearchController;