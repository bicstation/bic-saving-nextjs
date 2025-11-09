// /app/components/CategorySidebar.tsx

"use client";

import { useState, MouseEvent } from 'react';
import Link from "next/link";
import { Category } from "@/types/index"; 
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'; 


// --- 1. SubCategoryList の型定義とコンポーネント ---

interface SubCategoryListProps {
    subCategories: Category[];
    // ★追加: 現在のカテゴリIDを受け取る
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
    // ★追加: 現在のカテゴリIDを受け取る
    currentCategoryId: number | null | undefined; 
}

// アコーディオンアイテム（親カテゴリ）のコンポーネント
const CategoryItem = ({ category, activeId, setActiveId, currentCategoryId }: CategoryItemProps) => {
    const isOpen = activeId === category.id;
    const hasChildren = category.children && category.children.length > 0;
    
    // ★修正: 現在のカテゴリ、またはその親カテゴリであればハイライト（パス表示）
    const isCurrent = category.id === currentCategoryId;
    // 子カテゴリのリストに currentCategoryId が含まれているかチェック (簡易的な親のハイライト)
    const isParentOfCurrent = category.children?.some(c => c.id === currentCategoryId); 

    const handleToggle = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault(); 
        setActiveId(isOpen ? null : category.id);
    };

    return (
        <li 
            // ★修正: current-path クラスを追加して、現在地までのパスを視覚化
            className={`category-item ${isOpen ? 'open' : ''} ${isCurrent || isParentOfCurrent ? 'current-path' : ''}`}
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
    // ★追加: ページから渡される現在のカテゴリID
    currentCategoryId?: number | null; 
}

// サイドバー全体のコンポーネント
export default function CategorySidebar({ categories, currentCategoryId }: CategorySidebarProps) {
    // ★修正: currentCategoryId があれば、それを初期値としてアクティブにする
    // これにより、ページロード時に適切な階層が自動的に開く
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