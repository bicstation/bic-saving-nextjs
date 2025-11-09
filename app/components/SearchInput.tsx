// /app/components/SearchInput.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';

/**
 * リアルタイム検索の核となるカスタムフック
 * @param value 監視対象の値（キーワード）
 * @param delay 遅延時間（ミリ秒）
 * @returns デバウンス後の値
 */
function useDebounce<T>(value: T, delay: number): T {
    // デバウンス後の値を保持するState
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // valueが変更されてからdelayミリ秒後にdebouncedValueを更新するタイマーを設定
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // クリーンアップ関数（valueが変更されたり、コンポーネントがアンマウントされたりする前に実行）
        // タイマーをリセットすることで、連続入力中のリクエスト送信を防ぐ
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]); // value または delay が変更されたときに再実行

    return debouncedValue;
}


// --- SearchInput コンポーネント本体 ---
interface SearchInputProps {
    onSearch: (query: string) => void; // 検索クエリを親コンポーネントに渡すコールバック関数
}

const SearchInput: React.FC<SearchInputProps> = ({ onSearch }) => {
    // ユーザーの入力値を即座に反映するState
    const [searchTerm, setSearchTerm] = useState('');
    // 検索処理を遅延させるデバウンス後の値 (300ms)
    const debouncedSearchTerm = useDebounce(searchTerm, 300); 

    // デバウンスされた値が変更されたら、親コンポーネントに通知（検索実行）
    useEffect(() => {
        // 初回マウント時や空の文字列では検索を実行しない
        if (debouncedSearchTerm !== '') {
            onSearch(debouncedSearchTerm);
        }
    }, [debouncedSearchTerm, onSearch]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    return (
        <div className="search-input-container">
            <FaSearch className="search-icon" />
            <input
                type="text"
                placeholder="商品名でリアルタイム検索..."
                value={searchTerm}
                onChange={handleChange}
                className="search-input"
            />
        </div>
    );
};

export default SearchInput;