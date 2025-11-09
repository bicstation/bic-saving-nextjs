// /lib/data.ts (最終確認版 - 階層的パンくずリスト対応)

import { Category, ProductData, Product } from "@/types/index";

// 1. 環境変数からベースURLを取得 (例: "https://api.bic-saving.com")
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL; 

// 2. APIのバージョン付きベースURLを定義
const API_BASE_URL = `${BASE_URL}/api/v1`; 

// APIからカテゴリデータを取得する非同期関数
export async function getCategories(): Promise<Category[]> {
    const apiUrl = `${API_BASE_URL}/categories/`;
    try {
        const res = await fetch(apiUrl, { next: { revalidate: 3600 } }); 
        
        if (!res.ok) {
            console.error(`API Error (Categories): ${res.status} ${res.statusText}`);
            return [];
        }
        const data = await res.json();
        
        return Array.isArray(data) ? (data as Category[]) : (data.categories || data.results || []) as Category[];
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return [];
    }
}

// APIから商品データを取得する非同期関数
interface GetProductsParams {
    page?: number;
    limit?: number;
    categoryId?: number | null;
}

export async function getProducts({ page = 1, limit = 12, categoryId = null }: GetProductsParams): Promise<ProductData> {
    let apiUrl = `${API_BASE_URL}/products?page=${page}&limit=${limit}`;

    if (categoryId) {
        apiUrl += `&category=${categoryId}`; 
    }
    
    try {
        const res = await fetch(apiUrl, { 
            next: { revalidate: 1 }, 
        });
        
        if (!res.ok) {
            console.error(`API Error (Products): ${res.status} ${res.statusText}`);
            return { products: [], totalPages: 1 };
        }
        const data = await res.json();

        const totalItems = data.count || 0;
        const calculatedTotalPages = Math.ceil(totalItems / limit);

        return {
            products: (data.results || []) as Product[], 
            totalPages: calculatedTotalPages > 0 ? calculatedTotalPages : 1,
        };
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return { products: [], totalPages: 1 };
    }
}

// カテゴリ別商品取得関数
interface GetProductsByCategoryParams {
    categoryId: number;
    page?: number;
    limit?: number;
}
export async function getProductsByCategory({ categoryId, page, limit }: GetProductsByCategoryParams): Promise<ProductData> {
    if (!categoryId) {
        throw new Error("Category ID is required for getProductsByCategory.");
    }
    return getProducts({ page, limit, categoryId });
}

// ====================================================================
// カテゴリ名とパンくずパスのロジック
// ====================================================================

interface BreadcrumbItem {
    id: number;
    name: string;
}

/**
 * カテゴリツリーを再帰的に検索し、IDに一致するカテゴリ名を探す
 */
function findCategoryNameById(categories: Category[], id: string | number): string | null {
    if (!categories || categories.length === 0) {
        return null;
    }

    const targetId = parseInt(id.toString(), 10); 

    for (const category of categories) {
        if (category.id === targetId) {
            // ★修正: category_name も考慮して、名前を返す (より堅牢に)
            return category.name || category.category_name || null; 
        }
        
        if (category.children && category.children.length > 0) {
            const foundName = findCategoryNameById(category.children, id);
            if (foundName) {
                return foundName;
            }
        }
    }
    return null;
}

/**
 * カテゴリツリーを再帰的に検索し、指定されたIDからルートまでのパスを逆順（パンくず順）で返す
 */
function findCategoryPath(categories: Category[], targetId: number | string, path: BreadcrumbItem[] = []): BreadcrumbItem[] | null {
    const id = parseInt(targetId.toString(), 10);

    for (const category of categories) {
        const categoryName = category.name || category.category_name || ''; 
        
        // 現在のカテゴリをパスに追加
        const newPath = [...path, { id: category.id, name: categoryName }];

        if (category.id === id) {
            return newPath; // 目的のIDに到達したらパスを返す
        }

        if (category.children && category.children.length > 0) {
            // 子カテゴリを再帰的に検索
            const result = findCategoryPath(category.children as Category[], id, newPath);
            if (result) {
                return result; // 子から見つかったらそれを返す
            }
        }
    }
    return null; 
}

/**
 * カテゴリIDに基づいてカテゴリ名を取得する公開関数
 */
export async function getCategoryName(categoryId: string | number | null): Promise<string | null> {
    if (!categoryId) return null;
    
    const categories = await getCategories();
    return findCategoryNameById(categories, categoryId);
}

/**
 * カテゴリIDに基づいてパンくずリストのパスを取得する公開関数
 */
export async function getCategoryBreadcrumbPath(categoryId: string | number | null): Promise<BreadcrumbItem[]> {
    if (!categoryId) return [];
    
    const categories = await getCategories();
    
    return findCategoryPath(categories, categoryId) || [];
}