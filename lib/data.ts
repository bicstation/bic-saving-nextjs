// /lib/data.ts (メーカー名マッピングを追加)

import { Category, ProductData, Product, ApiProduct, Maker } from "@/types/index";

// 1. 環境変数からベースURLを取得 (例: "https://api.bic-saving.com")
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL; 

// 2. APIのバージョン付きベースURLを定義
const API_BASE_URL = `${BASE_URL}/api/v1`; 

// ====================================================================
// カテゴリデータ取得関数
// ====================================================================

/**
 * すべてのECカテゴリを階層構造で取得する関数
 * @returns Category[] - カテゴリの配列
 */
async function getCategories(): Promise<Category[]> {
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

// ====================================================================
// メーカーデータ取得関数
// ====================================================================

/**
 * すべてのメーカーリストを取得する関数
 * @returns Maker[] - メーカーの配列
 */
async function getAllMakers(): Promise<Maker[]> {
    const apiUrl = `${API_BASE_URL}/makers/`; 
    
    if (!BASE_URL) {
         console.error('Environment variable NEXT_PUBLIC_API_BASE_URL is not set.');
         return [];
    }
    
    try {
        const res = await fetch(apiUrl, { next: { revalidate: 3600 } }); 
        
        if (!res.ok) {
            console.error(`API Error (Makers): ${res.status} ${res.statusText}`);
            return [];
        }
        const data = await res.json();
        
        const makers = Array.isArray(data) ? (data as Maker[]) : (data.makers || data.results || []) as Maker[];
        
        return makers.sort((a, b) => a.name.localeCompare(b.name, 'ja'));

    } catch (error) {
        console.error("Failed to fetch makers:", error);
        return [];
    }
}


/**
 * スラッグに基づいてメーカー名を取得するヘルパー関数
 */
async function getMakerNameBySlug(slug: string): Promise<string | null> {
    const makers = await getAllMakers();
    const maker = makers.find(m => m.slug === slug);
    return maker ? maker.name : null;
}


// ====================================================================
// 商品データ取得関数
// ====================================================================

interface GetProductsParams {
    page?: number;
    limit?: number;
    categoryId?: number | null;
    query?: string | null; 
    makerSlug?: string | null; 
}

/**
 * 商品データを取得し、マッピング、フィルタリング、ページネーションを適用する。
 */
async function getProducts({ page = 1, limit = 12, categoryId = null, query = null, makerSlug = null }: GetProductsParams): Promise<ProductData> {
    
    // 依存するgetAllMakersを事前に取得
    // ★★★ 修正: makerName マッピングのために Makers を取得 ★★★
    const makers = await getAllMakers();
    const getMakerName = (slug: string) => makers.find(m => m.slug === slug)?.name || '不明';


    // --- apiUrlの決定ロジック ---
    let apiUrl = '';
    let needsFrontendPagination = false;

    if (query || makerSlug) {
        apiUrl = `${API_BASE_URL}/products?limit=1000`; 
        needsFrontendPagination = true;
        categoryId = null; 
    } else if (categoryId) {
        apiUrl = `${API_BASE_URL}/products?page=${page}&limit=${limit}&category=${categoryId}`;
        needsFrontendPagination = false;
    } else {
        apiUrl = `${API_BASE_URL}/products?page=${page}&limit=${limit}`; 
        needsFrontendPagination = false;
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
        
        // 1. ApiProduct を Product にマッピング
        const apiProducts = (data.results || []) as ApiProduct[];
        let allProducts: Product[] = apiProducts.map(apiProd => {
            
            const currentMakerSlug = apiProd.maker_slug || 'unknown';
            
            return {
                id: apiProd.id,
                name: apiProd.product_name, 
                price: parseFloat(apiProd.price.toString()), 
                image: apiProd.image_url, 
                description: apiProd.description || undefined,
                category: apiProd.category,
                makerSlug: currentMakerSlug,
                // ★★★ 修正: makerName を追加 (エラー解消) ★★★
                makerName: getMakerName(currentMakerSlug), 
                updated_at: apiProd.updated_at,
            }
        });

        // 2. フロントエンドでのフィルタリング処理
        if (query) {
            const lowerCaseQuery = query.toLowerCase();
            allProducts = allProducts.filter(product => 
                product.name.toLowerCase().includes(lowerCaseQuery) ||
                (product.description && product.description.toLowerCase().includes(lowerCaseQuery))
            );
        }
        
        // メーカーによるフィルタリング
        if (makerSlug) {
            allProducts = allProducts.filter(product => product.makerSlug === makerSlug);
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

// カテゴリ別商品取得関数 (省略)
interface GetProductsByCategoryParams {
    categoryId: number;
    page?: number;
    limit?: number;
}
async function getProductsByCategory({ categoryId, page, limit }: GetProductsByCategoryParams): Promise<ProductData> {
    if (!categoryId) {
        throw new Error("Category ID is required for getProductsByCategory.");
    }
    return getProducts({ page, limit, categoryId, query: null, makerSlug: null }); 
}

// メーカー別商品取得関数 (省略)
interface GetProductsByMakerParams {
    makerSlug: string;
    page?: number;
    limit?: number;
}
async function getProductsByMaker({ makerSlug, page, limit }: GetProductsByMakerParams): Promise<ProductData> {
    if (!makerSlug) {
        throw new Error("Maker Slug is required for getProductsByMaker.");
    }
    return getProducts({ page, limit, categoryId: null, query: null, makerSlug });
}


// ====================================================================
// 単一商品取得関数
// ====================================================================

async function getProductById(id: string | number): Promise<Product | null> {
    const apiUrl = `${API_BASE_URL}/products/${id}/`; 
    
    // 依存するgetAllMakersを事前に取得
    // ★★★ 修正: makerName マッピングのために Makers を取得 ★★★
    const makers = await getAllMakers();
    const getMakerName = (slug: string) => makers.find(m => m.slug === slug)?.name || '不明';

    try {
        const res = await fetch(apiUrl, { next: { revalidate: 60 } }); 
        
        if (!res.ok) {
            if (res.status === 404) {
                console.warn(`Product ID ${id} not found.`);
                return null;
            }
            console.error(`API Error (Product ${id}): ${res.status} ${res.statusText}`);
            return null;
        }
        
        const apiProd: any = await res.json(); 
        
        const currentMakerSlug = apiProd.maker_slug || 'unknown';

        // マッピング処理を適用 (ApiProduct -> Product)
        const product: Product = {
            id: apiProd.id,
            name: apiProd.product_name, 
            price: parseFloat(apiProd.price.toString()), 
            image: apiProd.image_url, 
            description: apiProd.description || undefined,
            category: apiProd.final_category_id || apiProd.category,
            makerSlug: currentMakerSlug,
            // ★★★ 修正: makerName を追加 (エラー解消) ★★★
            makerName: getMakerName(currentMakerSlug),
            updated_at: apiProd.updated_at,
        };

        return product;

    } catch (error) {
        console.error(`Failed to fetch product ${id}:`, error);
        return null;
    }
}

// ====================================================================
// カテゴリ名とパンくずパスのロジック (省略)
// ====================================================================

interface BreadcrumbItem {
    id: number;
    name: string;
}

function findCategoryNameById(categories: Category[], id: string | number): string | null {
// ... 省略 ...
    return null;
}
function findCategoryPath(categories: Category[], targetId: number | string, path: BreadcrumbItem[] = []): BreadcrumbItem[] | null {
// ... 省略 ...
    return null; 
}

/**
 * カテゴリIDからカテゴリ名を取得する
 */
async function getCategoryName(categoryId: string | number | null): Promise<string | null> {
    if (!categoryId) return null;
    
    const categories = await getCategories();
    return findCategoryNameById(categories, categoryId);
}

/**
 * カテゴリIDからパンくずパスを取得する
 */
async function getCategoryBreadcrumbPath(categoryId: string | number | null): Promise<BreadcrumbItem[]> {
    if (!categoryId) return [];
    
    const categories = await getCategories();
    
    return findCategoryPath(categories, categoryId) || [];
}

// ====================================================================
// Sitemap対応のための関数 (省略)
// ====================================================================

/**
 * APIから商品総数を取得する。
 */
async function getProductsCount(): Promise<number> {
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

async function getProductIdsForSitemap(offset: number, limit: number): Promise<ProductIdItem[]> {
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
            lastModified: apiProd.updated_at || new Date().toISOString(), 
        }));

    } catch (error) {
        console.error("Failed to fetch product IDs for sitemap:", error);
        return [];
    }
}


// ====================================================================
// エクスポートリスト 
// ====================================================================

export {
    // カテゴリ/全体の商品取得
    getCategories,
    getProducts,
    getProductsByCategory,
    
    // メーカー関連の関数をエクスポート
    getAllMakers,
    getMakerNameBySlug,
    getProductsByMaker,
    
    // 単一商品取得
    getProductById,
    
    // カテゴリ名/パンくず取得
    getCategoryName,
    getCategoryBreadcrumbPath,
    
    // Sitemap/RSS用
    getProductsCount,
    getProductIdsForSitemap,
};