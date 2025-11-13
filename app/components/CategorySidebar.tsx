// /app/components/CategorySidebar.tsx (カテゴリとメーカーを統合した最終版)

"use client";

import { useState, MouseEvent } from 'react';
import Link from "next/link";
import { Category, Maker } from "@/types/index"; 
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


// --- 1. SubCategoryList コンポーネント ---

interface SubCategoryListProps {
    subCategories: Category[];
    currentCategoryId: number | null | undefined; 
}

const SubCategoryList = ({ subCategories, currentCategoryId }: SubCategoryListProps) => {
    const sortedSubCategories = [...subCategories].sort((a, b) => 
        (b.product_count || 0) - (a.product_count || 0)
    );
    const top20SubCategories = sortedSubCategories.slice(0, 20); // 上位20件のみ表示

    return (
        <ul className="sub-category-list">
            {top20SubCategories.map((subCat) => (
                <li 
                    key={subCat.id} 
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


// --- 2. CategoryItem コンポーネント ---

interface CategoryItemProps {
    category: Category; 
    activeId: number | null; 
    setActiveId: (id: number | null) => void;
    currentCategoryId: number | null | undefined; 
}

const CategoryItem = ({ category, activeId, setActiveId, currentCategoryId }: CategoryItemProps) => {
    const isOpen = activeId === category.id;
    const hasChildren = category.children && category.children.length > 0;
    
    // 現在のカテゴリがこの親カテゴリ、またはその子孫に含まれるかチェック
    const isPathActive = isAncestorOf(category, currentCategoryId);

    const handleToggle = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault(); 
        setActiveId(isOpen ? null : category.id);
    };

    return (
        <li 
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

            {/* 子カテゴリリスト */}
            {isOpen && hasChildren && (
                <SubCategoryList 
                    subCategories={category.children as Category[]} 
                    currentCategoryId={currentCategoryId} 
                />
            )}
        </li>
    );
};


// --- 3. CategorySidebar メインコンポーネント ---

interface CategorySidebarProps {
    categories: Category[]; 
    makers?: Maker[]; 
    currentCategoryId?: number | null; 
    currentMakerSlug?: string;
}

export default function CategorySidebar({ 
    categories, 
    makers = [], 
    currentCategoryId, 
    currentMakerSlug 
}: CategorySidebarProps) {
    
    // アコーディオンの開閉状態
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(currentCategoryId || null);
    
    // メーカーを名前順にソート
    const sortedMakers = [...makers].sort((a, b) => a.name.localeCompare(b.name, 'ja'));


    return (
        <aside className="sidebar">
            
            {/* 🔑 管理メニュー */}
            <h3>🔑 管理メニュー</h3>
            <ul>
                <li><Link href="#">管理トップ</Link></li>
                <li><Link href="#">商品登録</Link></li>
            </ul>

            {/* 📚 カテゴリ一覧 */}
            <h3>📚 カテゴリ一覧</h3>
            <ul className="category-accordion">
                {categories.length === 0 ? (
                    <p>カテゴリデータが見つかりませんでした。</p>
                ) : (
                    <>
                        <li style={{ listStyleType: 'none', padding: '5px 0' }}>
                            <Link 
                                href="/" 
                                className={currentCategoryId === undefined ? 'font-bold text-primary' : 'text-text'}
                            >
                                🏠 全ての商品を見る
                            </Link>
                        </li>
                        {categories.map((category) => (
                            <CategoryItem 
                                key={category.id} 
                                category={category}
                                activeId={activeCategoryId}
                                setActiveId={setActiveCategoryId}
                                currentCategoryId={currentCategoryId}
                            />
                        ))}
                    </>
                )}
            </ul>
            
            {/* 🏭 メーカーで絞り込む */}
            <h3>🏭 メーカーで絞り込む</h3>
            <ul className="maker-list">
                {sortedMakers.length === 0 ? (
                    <p>メーカーデータが見つかりませんでした。</p>
                ) : (
                    <>
                        <li style={{ listStyleType: 'none', padding: '5px 0' }}>
                            <Link 
                                href="/" 
                                className={currentMakerSlug === undefined ? 'font-bold text-primary' : 'text-text'}
                            >
                                🏠 全ての商品を見る
                            </Link>
                        </li>
                        {sortedMakers.map((maker) => (
                            <li 
                                key={maker.slug} 
                                style={{ listStyleType: 'none', padding: '4px 0' }}
                            >
                                <Link 
                                    href={`/maker/${maker.slug}`} 
                                    style={{ 
                                        fontWeight: maker.slug === currentMakerSlug ? 'bold' : 'normal', 
                                        color: maker.slug === currentMakerSlug ? 'var(--color-primary)' : 'var(--color-text)',
                                        // 現在選択中のメーカーを視覚的に強調
                                        backgroundColor: maker.slug === currentMakerSlug ? 'var(--color-bg)' : 'transparent',
                                        padding: '2px 5px',
                                        borderRadius: '4px',
                                        display: 'block',
                                    }}
                                >
                                    {maker.name}
                                </Link>
                            </li>
                        ))}
                    </>
                )}
            </ul>


            {/* 📢 その他メニュー */}
            <h3>📢 その他メニュー</h3>
            <ul>
                <li><Link href="#">新着情報</Link></li>
                <li><Link href="#">おすすめ商品</Link></li>
            </ul>
        </aside>
    );
}