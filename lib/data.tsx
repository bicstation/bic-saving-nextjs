// /lib/data.ts (最終完全統合版 - Sitemap/RSS updated_at対応済み)

import { Category, ProductData, Product, ApiProduct } from "@/types/index";

// 1. 環境変数からベースURLを取得 (例: "https://api.bic-saving.com")
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL; 

// 2. APIのバージョン付きベースURLを定義
const API_BASE_URL = `${BASE_URL}/api/v1`; 

// APIからカテゴリデータを取得する非同期関数
export async function getCategories(): Promise<Category[]> {
    const apiUrl = `${API_BASE_URL}/categories/`;
    try {
        // カテゴリは更新頻度が低いと想定し、長めのrevalidateを設定
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
    query?: string | null; 
}

/**
 * 商品データを取得し、マッピング、フィルタリング、ページネーションを適用する。
 */
export async function getProducts({ page = 1, limit = 12, categoryId = null, query = null }: GetProductsParams): Promise<ProductData> {
    
    // --- apiUrlの決定ロジック ---
    let apiUrl = '';
    let needsFrontendPagination = false;

    if (query) {
        // シナリオ 1: キーワード検索時（全件取得し、フロントでフィルタ・ページネーション）
        apiUrl = `${API_BASE_URL}/products?limit=1000`; 
        needsFrontendPagination = true;
        categoryId = null;
    } else if (categoryId) {
        // シナリオ 2: カテゴリ検索時 (APIのページネーションに任せる)
        apiUrl = `${API_BASE_URL}/products?page=${page}&limit=${limit}&category=${categoryId}`;
        needsFrontendPagination = false;
        query = null;
    } else {
        // シナリオ 3: トップページ (APIのページネーションに任せる)
        apiUrl = `${API_BASE_URL}/products?page=${page}&limit=${limit}`; 
        needsFrontendPagination = false;
    }
    
    try {
        const res = await fetch(apiUrl, { 
            next: { revalidate: 1 }, // 商品一覧は頻繁に更新されると想定
        });
        
        if (!res.ok) {
            console.error(`API Error (Products): ${res.status} ${res.statusText}`);
            return { products: [], totalPages: 1 };
        }
        const data = await res.json();
        
        // 1. ApiProduct を Product にマッピング
        const apiProducts = (data.results || []) as ApiProduct[];
        let allProducts: Product[] = apiProducts.map(apiProd => ({
            id: apiProd.id,
            name: apiProd.product_name,         
            price: parseFloat(apiProd.price.toString()), 
            image: apiProd.image_url,           
            description: apiProd.description || undefined,
            category: apiProd.category,
            // ★★★ 修正: updated_at のマッピングを追加 ★★★
            updated_at: apiProd.updated_at,
        }));

        // 2. フロントエンドでのキーワードフィルタリング処理
        if (query) {
            const lowerCaseQuery = query.toLowerCase();
            allProducts = allProducts.filter(product => 
                product.name.toLowerCase().includes(lowerCaseQuery) ||
                (product.description && product.description.toLowerCase().includes(lowerCaseQuery))
            );
        }

        if (needsFrontendPagination) {
            // 3. フロントエンドでページネーションのロジックを適用
            const totalItems = allProducts.length;
            const calculatedTotalPages = Math.ceil(totalItems / limit);

            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const productsForPage = allProducts.slice(startIndex, endIndex);

            return {
                products: productsForPage, 
                totalPages: calculatedTotalPages > 0 ? calculatedTotalPages : 1,
            };
        } else {
            // 3. APIのページネーションの結果をそのまま返す
            const totalItems = data.count || allProducts.length;
            const calculatedTotalPages = Math.ceil(totalItems / limit);

            return {
                products: allProducts, // APIがすでにページネーション済み
                totalPages: calculatedTotalPages > 0 ? calculatedTotalPages : 1,
            };
        }

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
    return getProducts({ page, limit, categoryId, query: null }); 
}

// ====================================================================
// 単一商品取得関数
// ====================================================================

/**
 * IDに基づいて単一の商品データを取得し、マッピングする。
 */
export async function getProductById(id: string | number): Promise<Product | null> {
    const apiUrl = `${API_BASE_URL}/products/${id}/`; 
    
    try {
        const res = await fetch(apiUrl, { next: { revalidate: 60 } }); // 商品詳細ページは60秒再検証
        
        if (!res.ok) {
            if (res.status === 404) {
                console.warn(`Product ID ${id} not found.`);
                return null;
            }
            console.error(`API Error (Product ${id}): ${res.status} ${res.statusText}`);
            return null;
        }
        
        const apiProd: any = await res.json(); 
        
        // マッピング処理を適用 (ApiProduct -> Product)
        const product: Product = {
            id: apiProd.id,
            name: apiProd.product_name,       
            price: parseFloat(apiProd.price.toString()), 
            image: apiProd.image_url,         
            description: apiProd.description || undefined,
            category: apiProd.final_category_id || apiProd.category,
            // ★★★ 修正: updated_at のマッピングを追加 ★★★
            updated_at: apiProd.updated_at,
        };

        return product;

    } catch (error) {
        console.error(`Failed to fetch product ${id}:`, error);
        return null;
    }
}

// ====================================================================
// カテゴリ名とパンくずパスのロジック
// ====================================================================

interface BreadcrumbItem {
    id: number;
    name: string;
}

function findCategoryNameById(categories: Category[], id: string | number): string | null {
    if (!categories || categories.length === 0) {
        return null;
    }

    const targetId = parseInt(id.toString(), 10); 

    for (const category of categories) {
        if (category.id === targetId) {
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

function findCategoryPath(categories: Category[], targetId: number | string, path: BreadcrumbItem[] = []): BreadcrumbItem[] | null {
    const id = parseInt(targetId.toString(), 10);

    for (const category of categories) {
        const categoryName = category.name || category.category_name || ''; 
        
        const newPath = [...path, { id: category.id, name: categoryName }];

        if (category.id === id) {
            return newPath; 
        }

        if (category.children && category.children.length > 0) {
            const result = findCategoryPath(category.children as Category[], id, newPath);
            if (result) {
                return result; 
            }
        }
    }
    return null; 
}

export async function getCategoryName(categoryId: string | number | null): Promise<string | null> {
    if (!categoryId) return null;
    
    const categories = await getCategories();
    return findCategoryNameById(categories, categoryId);
}

export async function getCategoryBreadcrumbPath(categoryId: string | number | null): Promise<BreadcrumbItem[]> {
    if (!categoryId) return [];
    
    const categories = await getCategories();
    
    return findCategoryPath(categories, categoryId) || [];
}

// ====================================================================
// Sitemap対応のための関数
// ====================================================================

/**
 * APIから商品総数を取得する。
 */
export async function getProductsCount(): Promise<number> {
    const apiUrl = `${API_BASE_URL}/products?limit=1`;
    try {
        const res = await fetch(apiUrl, { next: { revalidate: 3600 } }); 
        
        if (!res.ok) {
            console.error(`API Error (Products Count): ${res.status} ${res.statusText}`);
            return 0;
        }
        const data = await res.json();
        
        return data.count && typeof data.count === 'number' ? data.count : 0;
    } catch (error) {
        console.error("Failed to fetch products count:", error);
        return 0;
    }
}


/**
 * サイトマップ分割用に、指定された範囲の商品IDと最終更新日を取得する。
 */
interface ProductIdItem {
    id: number;
    lastModified: string; 
}

export async function getProductIdsForSitemap(offset: number, limit: number): Promise<ProductIdItem[]> {
    const apiUrl = `${API_BASE_URL}/products?limit=${limit}&offset=${offset}`; 
    
    try {
        const res = await fetch(apiUrl, { next: { revalidate: 3600 } }); 
        
        if (!res.ok) {
            console.error(`API Error (Sitemap IDs): ${res.status} ${res.statusText}`);
            return [];
        }
        const data = await res.json();
        
        const apiProducts = (data.results || []) as ApiProduct[];

        return apiProducts.map(apiProd => ({
            id: apiProd.id,
            // 最終更新日フィールドがAPIになければ、現在の日付を使用
            lastModified: apiProd.updated_at || new Date().toISOString(), 
        }));

    } catch (error) {
        console.error("Failed to fetch product IDs for sitemap:", error);
        return [];
    }
}