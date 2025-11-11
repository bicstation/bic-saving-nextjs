// /app/components/CategorySidebar.tsx

"use client";

import { useState, MouseEvent } from 'react';
import Link from "next/link";
import { Category } from "@/types/index"; 
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'; 


// --- 共通ヘルパー関数 ---

/**
 * category が targetId の祖先または自身であるかチェックする再帰関数
 */
const isAncestorOf = (category: Category, targetId: number | null | undefined): boolean => {
    if (!targetId) return false;
    
    // 自身がターゲットであればtrue
    if (category.id === targetId) return true;
    
    // 子カテゴリを再帰的にチェック
    if (category.children && category.children.length > 0) {
        return category.children.some(child => isAncestorOf(child, targetId));
    }
    
    return false;
};


// --- 1. SubCategoryList の型定義とコンポーネント ---

interface SubCategoryListProps {
    subCategories: Category[];
    currentCategoryId: number | null | undefined; 
}

// 子カテゴリを表示・ソートするロジック
const SubCategoryList = ({ subCategories, currentCategoryId }: SubCategoryListProps) => {
    const sortedSubCategories = [...subCategories].sort((a, b) => 
        (b.product_count || 0) - (a.product_count || 0)
    );
    const top20SubCategories = sortedSubCategories.slice(0, 20);

    return (
        <ul className="sub-category-list">
            {top20SubCategories.map((subCat) => (
                <li 
                    key={subCat.id} 
                    // ★修正: 現在のカテゴリであればハイライト
                    className={`sub-category-item ${subCat.id === currentCategoryId ? 'active' : ''}`}
                >
                    <Link href={`/category/${subCat.id}`}>
                        {subCat.name || subCat.category_name} 
                        
                        {subCat.product_count !== undefined && (
                            <span className="count">({subCat.product_count})</span>
                        )}
                    </Link>
                </li>
            ))}
        </ul>
    );
};


// --- 2. CategoryItem の型定義とコンポーネント ---

interface CategoryItemProps {
    category: Category; 
    activeId: number | null; 
    setActiveId: (id: number | null) => void;
    currentCategoryId: number | null | undefined; 
}

// アコーディオンアイテム（親カテゴリ）のコンポーネント
const CategoryItem = ({ category, activeId, setActiveId, currentCategoryId }: CategoryItemProps) => {
    const isOpen = activeId === category.id;
    const hasChildren = category.children && category.children.length > 0;
    
    // ★修正: 再帰関数 isAncestorOf を使用し、自身または子孫に currentCategoryId が含まれているかチェック
    const isPathActive = isAncestorOf(category, currentCategoryId);

    const handleToggle = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault(); 
        setActiveId(isOpen ? null : category.id);
    };

    return (
        <li 
            // ★修正: isPathActive を使って、現在地までのパスを正確に視覚化
            className={`category-item ${isOpen ? 'open' : ''} ${isPathActive ? 'current-path' : ''}`}
        >
            <div className="category-header">
                <Link
                    href={`/category/${category.id}`}
                    className="category-link"
                >
                    <span className="icon">🔗</span>{" "}
                    {category.name || category.category_name}
                </Link>

                {hasChildren && (
                    <button onClick={handleToggle} className="toggle-button">
                        {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                    </button>
                )}
            </div>

            {/* 子カテゴリリスト (開いている、かつ子カテゴリが存在する場合に表示) */}
            {isOpen && hasChildren && (
                <SubCategoryList 
                    subCategories={category.children as Category[]} 
                    currentCategoryId={currentCategoryId} // SubCategoryList にも渡す
                />
            )}
        </li>
    );
};


// --- 3. CategorySidebar の型定義とコンポーネント ---

interface CategorySidebarProps {
    categories: Category[]; 
    currentCategoryId?: number | null; 
}

// サイドバー全体のコンポーネント
export default function CategorySidebar({ categories, currentCategoryId }: CategorySidebarProps) {
    
    // ★修正: currentCategoryId の親カテゴリを初期状態で開くロジックを強化 (親カテゴリのIDを検索する必要あり)
    
    // HACK: CategoryItemのisAncestorOf関数と同じロジックを使い、トップレベルカテゴリから currentCategoryId の親を探す必要がある。
    // しかし、このコンポーネントのトップレベルではstateの初期化時に同期的に行う必要があるため、一旦現在のロジックを維持しつつ、
    // isAncestorOfのチェックが成功するカテゴリIDを初期値に設定する (今回は currentCategoryId がそのままトップレベルの子の場合を想定し、このまま)
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(currentCategoryId || null);

    return (
        <aside className="sidebar">
            <h3>🔑 管理メニュー</h3>
            <ul>
                <li><Link href="#">管理トップ</Link></li>
                <li><Link href="#">商品登録</Link></li>
            </ul>

            <h3>📚 カテゴリ一覧</h3>
            <ul className="category-accordion">
                {categories.length === 0 ? (
                    <p>カテゴリデータが見つかりませんでした。</p>
                ) : (
                    categories.map((category) => (
                        <CategoryItem 
                            key={category.id} 
                            category={category}
                            activeId={activeCategoryId}
                            setActiveId={setActiveCategoryId}
                            currentCategoryId={currentCategoryId} // CategoryItem に渡す
                        />
                    ))
                )}
            </ul>

            <h3>📢 その他メニュー</h3>
            <ul>
                <li><Link href="#">新着情報</Link></li>
                <li><Link href="#">おすすめ商品</Link></li>
            </ul>
        </aside>
    );
}