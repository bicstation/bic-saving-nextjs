// /lib/data.ts (最終修正版 - APIスラッグマッピング追加 & product_url対応)

import { Category, ProductData, Product, ApiProduct, Maker } from "@/types/index";

// 1. 環境変数からベースURLを取得し、フォールバックを設定
const API_BASE_URL_CONFIGURED = process.env.NEXT_PUBLIC_API_BASE_URL;

// 開発環境と本番環境でベースURLを決定 (ホスト名のみ)
// .env.localで /api/v1 を削除したため、ここでのフォールバックロジックが重要になります。
const BASE_HOST_URL = 
    API_BASE_URL_CONFIGURED || 
    (process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8003'           // ローカル開発用 (8003を使用)
        : 'https://api.bic-saving.com');    // 本番デプロイ用フォールバック

// 2. APIのバージョン付きベースURLを定義
// BASE_HOST_URL の末尾のスラッシュを安全に除去してから /api/v1 を追加する
const API_BASE_URL = BASE_HOST_URL.replace(/\/$/, '') + '/api/v1';

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
    
    // API_BASE_URL_INTERNAL のチェックは BASE_HOST_URL で置き換え
    if (!BASE_HOST_URL) {
           console.error('Environment variable NEXT_PUBLIC_API_BASE_URL is not set and fallback failed.');
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
    
    // ===========================================================
    // ★★ デバッグログ開始 ★★
    // ===========================================================
    console.log("\n[DEBUG: getMakerNameBySlug]");
    console.log(`Target Slug (from URL/Router): "${slug}"`);
    console.log(`Total Makers Loaded for comparison: ${makers.length}`);
    
    // 完全に一致するかどうかを確認
    const maker = makers.find(m => {
        return m.slug === slug;
    });

    if (maker) {
        console.log(`✅ MATCH FOUND! Maker Name: "${maker.name}"`);
    } else {
        console.log("❌ NO MATCH FOUND. Check for subtle character differences in API data.");
    }
    console.log("[DEBUG: END]\n");
    // ===========================================================
    // ★★ デバッグログ終了 ★★
    // ===========================================================
    
    return maker ? maker.name : null;
}


/**
 * メーカーの日本語名とAPI用スラッグの対応付けをマップとして取得する (★新規追加★)
 */
async function getMakerSlugMap(): Promise<Map<string, string>> {
    try {
        const makers = await getAllMakers(); 
        
        const slugMap = new Map<string, string>();
        
        makers.forEach(maker => {
            // マップのキーはURLから切り出した日本語名 (例: "公式オシャレウォーカー")
            // 値はAPIが要求するスラッグ (例: "oshare-walker-official-store")
            slugMap.set(maker.name, maker.slug);
        });
        
        return slugMap;
    } catch (error) {
        console.error("メーカーマッピングの取得に失敗しました:", error);
        return new Map();
    }
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
    const makers = await getAllMakers();
    const getMakerName = (slug: string) => makers.find(m => m.slug === slug)?.name || '不明';


    // --- apiUrlの決定ロジック ---
    let apiUrl = '';
    let needsFrontendPagination = false;

    if (makerSlug) {
        // MakerFilterの場合は、APIの負荷軽減のため一旦全件取得(limit=1000)
        // かつ APIのクエリに maker= を付けてメーカー側でフィルタリングする
        apiUrl = `${API_BASE_URL}/products?maker=${makerSlug}&limit=1000`; 
        needsFrontendPagination = true;
        query = null;
        categoryId = null; 
    } else if (query) {
        // queryはそのまま全件取得 (APIがqueryフィルタをサポートしないと仮定)
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
            
            const currentMakerSlug = (apiProd as any).maker_slug || 'unknown'; 
            
            return {
                id: apiProd.id,
                name: apiProd.product_name, 
                price: parseFloat(apiProd.price.toString()), 
                image: apiProd.image_url, 
                description: apiProd.description || undefined,
                category: apiProd.category,
                makerSlug: currentMakerSlug,
                makerName: getMakerName(currentMakerSlug), 
                updated_at: apiProd.updated_at,
                // ★修正: product_url を含める (型定義になくてもオブジェクトに含める)
                product_url: (apiProd as any).product_url 
            } as Product; // 型アサーションでProduct型として返す (page.tsx側で any キャストして使う想定)
        });

        // 2. フロントエンドでのフィルタリング処理 (query のみ)
        if (query) {
            const lowerCaseQuery = query.toLowerCase();
            allProducts = allProducts.filter(product => 
                product.name.toLowerCase().includes(lowerCaseQuery) ||
                (product.description && product.description.toLowerCase().includes(lowerCaseQuery))
            );
        }
        
        // メーカーによるフィルタリングはAPI側で行われるため、フロントエンドでは不要
        // if (makerSlug) { ... }
        
        // ===========================================================
        // ★★ デバッグログ (Product取得時) ★★
        // ===========================================================
        if ((makerSlug || query) && needsFrontendPagination) {
            console.log("\n[DEBUG: getProducts]");
            console.log(`Filtering by Maker Slug (API): "${makerSlug}"`);
            console.log(`Filtered Product Count (API response): ${allProducts.length}`);
            console.log("[DEBUG: END]\n");
        }
        // ===========================================================


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
async function getProductsByCategory({ categoryId, page, limit }: GetProductsByCategoryParams): Promise<ProductData> {
    if (!categoryId) {
        throw new Error("Category ID is required for getProductsByCategory.");
    }
    return getProducts({ page, limit, categoryId, query: null, makerSlug: null }); 
}

// メーカー別商品取得関数 
interface GetProductsByMakerParams {
    makerSlug: string;
    page?: number;
    limit?: number;
}
async function getProductsByMaker({ makerSlug, page, limit }: GetProductsByMakerParams): Promise<ProductData> {
    if (!makerSlug) {
        throw new Error("Maker Slug is required for getProductsByMaker.");
    }
    // ここで渡される makerSlug は、page.tsxで変換されたAPI用のスラッグ (例: "oshare-walker-official-store")
    return getProducts({ page, limit, categoryId: null, query: null, makerSlug });
}


// 単一商品取得関数
async function getProductById(id: string | number): Promise<Product | null> {
    const apiUrl = `${API_BASE_URL}/products/${id}/`; 
    
    // 依存するgetAllMakersを事前に取得
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
            makerName: getMakerName(currentMakerSlug),
            updated_at: apiProd.updated_at,
            product_url: apiProd.product_url,
            // ★修正: product_url を含める (データベースの product_url カラムに対応)
            // 型定義(Product)にない場合は any キャストや拡張が必要ですが、
            // ここではオブジェクトリテラルに追加し、戻り値として返します。
            // (呼び出し側で (product as any).product_url としてアクセスするため)
            // ...({ product_url: apiProd.product_url } as any) 
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

/**
 * カテゴリIDからカテゴリ名を見つけるヘルパー関数
 */
function findCategoryNameById(categories: Category[], id: string | number): string | null {
    const targetId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    const findRecursive = (cats: Category[]): string | null => {
        for (const cat of cats) {
            if (cat.id === targetId) {
                return cat.name;
            }
            if (cat.children && cat.children.length > 0) {
                const found = findRecursive(cat.children);
                if (found) return found;
            }
        }
        return null;
    };
    
    return findRecursive(categories);
}

/**
 * カテゴリIDからパンくずパスを見つけるヘルパー関数
 */
function findCategoryPath(categories: Category[], targetId: number | string, path: BreadcrumbItem[] = []): BreadcrumbItem[] | null {
    const numericTargetId = typeof targetId === 'string' ? parseInt(targetId, 10) : targetId;
    
    for (const category of categories) {
        const newPath = [...path, { id: category.id, name: category.name }];
        
        if (category.id === numericTargetId) {
            return newPath;
        }
        
        if (category.children && category.children.length > 0) {
            const foundPath = findCategoryPath(category.children, numericTargetId, newPath);
            if (foundPath) {
                return foundPath;
            }
        }
    }
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
// Sitemap対応のための関数
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
    getMakerSlugMap, // ★新規エクスポート★
    
    // 単一商品取得
    getProductById,
    
    // カテゴリ名/パンくず取得
    getCategoryName,
    getCategoryBreadcrumbPath,
    
    // Sitemap/RSS用
    getProductsCount,
    getProductIdsForSitemap,
};