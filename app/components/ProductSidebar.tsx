// /app/components/ProductSidebar.tsx (CategorySidebarからリネーム)

"use client";

import { useState, MouseEvent } from 'react';
import Link from "next/link";
// Maker型を追加でインポート
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
        <ul className="sub-category-list" style={{ paddingLeft: '15px' }}>
            {top20SubCategories.map((subCat) => (
                <li 
                    key={subCat.id} 
                    // ★修正: 現在のカテゴリであればハイライト
                    className={`sub-category-item ${subCat.id === currentCategoryId ? 'active' : ''}`}
                    style={{ listStyleType: 'none', padding: '5px 0' }}
                >
                    <Link 
                        href={`/category/${subCat.id}`} 
                        style={{ fontWeight: subCat.id === currentCategoryId ? 'bold' : 'normal', color: '#333' }}
                    >
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
            style={{ listStyleType: 'none', margin: '5px 0' }}
        >
            <div className="category-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link
                    href={`/category/${category.id}`}
                    className="category-link"
                    style={{ fontWeight: category.id === currentCategoryId ? 'bold' : 'normal', color: '#333' }}
                >
                    <span className="icon">🔗</span>{" "}
                    {category.name || category.category_name}
                </Link>

                {hasChildren && (
                    <button 
                        onClick={handleToggle} 
                        className="toggle-button"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                    >
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


// --- 3. ProductSidebar の型定義とコンポーネント (CategorySidebarからリネーム) ---

interface ProductSidebarProps {
    categories: Category[]; 
    makers: Maker[]; // ★追加: メーカーリスト
    currentCategoryId?: number | null; 
    currentMakerSlug?: string; // ★追加: 現在選択されているメーカーのスラッグ
}

// サイドバー全体のコンポーネント
export default function ProductSidebar({ 
    categories, 
    makers, 
    currentCategoryId, 
    currentMakerSlug 
}: ProductSidebarProps) {
    
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(currentCategoryId || null);

    return (
        <aside 
            className="sidebar" 
            style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px', background: '#fff' }}
        >
            
            {/* 📚 カテゴリ一覧 */}
            <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px', fontSize: '1.2rem' }}>
                📚 カテゴリ一覧
            </h3>
            <ul className="category-accordion" style={{ padding: 0, marginBottom: '30px' }}>
                {categories.length === 0 ? (
                    <p>カテゴリデータが見つかりませんでした。</p>
                ) : (
                    <>
                        <li style={{ listStyleType: 'none', padding: '5px 0', fontWeight: currentCategoryId === null ? 'bold' : 'normal' }}>
                            <Link href="/" style={{ color: currentCategoryId === null ? '#0070f3' : '#333' }}>
                                全ての商品を見る
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
            
            {/* 🏭 メーカー一覧 (★新規追加部分★) */}
            <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px', fontSize: '1.2rem' }}>
                🏭 メーカーで絞り込む
            </h3>
            <ul style={{ padding: 0 }}>
                {/* ★★★ この makers.length === 0 の行でエラーが発生したと推測されます ★★★ */}
                {makers.length === 0 ? (
                    <p>メーカーデータが見つかりませんでした。</p>
                ) : (
                    <>
                        <li style={{ listStyleType: 'none', padding: '5px 0', fontWeight: currentMakerSlug === undefined ? 'bold' : 'normal' }}>
                            <Link href="/" style={{ color: currentMakerSlug === undefined ? '#0070f3' : '#333' }}>
                                全ての商品を見る
                            </Link>
                        </li>
                        {makers.map((maker) => (
                            <li 
                                key={maker.slug} 
                                style={{ 
                                    listStyleType: 'none', 
                                    padding: '5px 0',
                                    fontWeight: maker.slug === currentMakerSlug ? 'bold' : 'normal',
                                    backgroundColor: maker.slug === currentMakerSlug ? '#f0f0f0' : 'transparent',
                                }}
                            >
                                <Link href={`/maker/${maker.slug}`} style={{ textDecoration: 'none', color: '#333' }}>
                                    {maker.name}
                                </Link>
                            </li>
                        ))}
                    </>
                )}
            </ul>
            
        </aside>
    );
}