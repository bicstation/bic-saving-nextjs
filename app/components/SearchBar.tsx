// /app/components/SearchBar.tsx

'use client'; // Client Componentとしてマーク

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';

// Next.jsのClient Componentとして動作します
export default function SearchBar() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    // URLの 'query' パラメータから初期値を設定
    const initialQuery = searchParams.get('query') || '';
    const [searchTerm, setSearchTerm] = useState(initialQuery);
    
    // URLが変わったときに内部の状態をリセット（戻るボタン対応）
    useEffect(() => {
        const currentQuery = searchParams.get('query') || '';
        setSearchTerm(currentQuery);
    }, [searchParams]);


    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        const params = new URLSearchParams(searchParams);

        if (searchTerm.trim()) {
            params.set('query', searchTerm.trim());
            // 検索時は常にページを1にリセット
            params.set('page', '1'); 
            
            // カテゴリIDを削除して、検索結果のみを表示
            if (params.has('categoryId')) {
                params.delete('categoryId');
            }

        } else {
            // 検索語が空の場合はクエリを削除
            params.delete('query');
            params.delete('page');
        }

        // URLを更新して検索を実行
        // ルートパスに検索クエリを適用
        replace(`/?${params.toString()}`);
    };

    return (
        // ★修正: インラインFlexboxを削除し、.search-input-containerクラスを適用
        <form onSubmit={handleSearch} className="search-input-container">
            <input
                type="text"
                placeholder="商品名やキーワードで検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                // ★修正: .search-inputクラスを適用し、インラインstyleを削除
                className="search-input"
            />
            {/* ボタンは既存のCSS設計に合わせてインラインstyleの一部を維持/調整 */}
            <button 
                type="submit"
                style={{
                    padding: '8px 15px',
                    fontSize: '16px',
                    backgroundColor: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0 4px 4px 0',
                    cursor: 'pointer'
                }}
            >
                検索
            </button>
        </form>
    );
}